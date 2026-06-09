import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../graphql/queries";

const AuthContext = createContext();

// Helper functions
const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("token");

const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const setAuthData = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage immediately (synchronously)
  const [user, setUser] = useState(() => getStoredUser());
  // Active role for CRC users to switch between CRC and Student views
  // Initialize from localStorage to persist across refreshes
  const [activeRole, setActiveRole] = useState(() => {
    const storedUser = getStoredUser();
    const storedActiveRole = localStorage.getItem("activeRole");
    // For CRC users, use stored activeRole if available, otherwise default to CRC
    if (storedUser?.role === 'CRC') {
      return storedActiveRole || 'CRC';
    }
    // For non-CRC users, use their actual role
    return storedUser?.role || null;
  });
  const inactivityTimerRef = useRef(null);

  // Login mutation
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);

  // Toggle active role for CRC users (between CRC and STUDENT views)
  const toggleRole = useCallback(() => {
    if (user?.role === 'CRC') {
      setActiveRole(prev => {
        const newRole = prev === 'CRC' ? 'STUDENT' : 'CRC';
        // Persist to localStorage
        localStorage.setItem("activeRole", newRole);
        return newRole;
      });
    }
  }, [user?.role]);

  // Logout function
  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("activeRole"); // Clear persisted active role
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      logout();
    }, 10 * 60 * 1000); // 10 minutes
  }, [logout]);

  // Setup inactivity tracking - run once on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    // Setup inactivity tracking
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    let activityTimeout;

    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        // Only reset timer if user is logged in
        if (getToken() && getStoredUser()) {
          resetInactivityTimer();
        }
      }, 1000);
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the timer if user is logged in
    if (storedUser && token) {
      resetInactivityTimer();
    }

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [resetInactivityTimer]);

  // Listen for storage changes (other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        // Token was removed (logout from another tab)
        setUser(null);
      } else if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Redirect CRC users to CRC view if they're on student routes but not in student mode
  useEffect(() => {
    if (user?.role === 'CRC' && activeRole === 'CRC') {
      const currentPath = window.location.pathname;
      // Check if on student routes
      if (currentPath.startsWith('/student')) {
        // Navigate to CRC dashboard
        window.location.href = '/crc/dashboard';
      }
    }
  }, [user?.role, activeRole]);

  const login = async (email, password) => {
    try {
      const result = await loginMutation({ variables: { email, password } });

      if (result?.data?.login) {
        const { token, user: userData } = result.data.login;
        setAuthData(token, userData);
        setUser(userData);
        // Set active role for CRC users (default to CRC mode)
        setActiveRole(userData.role === 'CRC' ? 'CRC' : userData.role);
        resetInactivityTimer();
        return { success: true, user: userData };
      }

      return {
        success: false,
        error: "Invalid email or password"
      };
    } catch (error) {
      const graphqlError = error.graphQLErrors?.[0]?.message;
      return {
        success: false,
        error: graphqlError || error.message || "Invalid email or password"
      };
    }
  };

  const updateUser = useCallback((userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, []);

  const value = {
    user,
    loginLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    resetInactivityTimer,
    activeRole,
    toggleRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
