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
  const [activeRole, setActiveRole] = useState(() => {
    const storedUser = getStoredUser();
    // For CRC users, default to CRC role, for others use their actual role
    return storedUser?.role === 'CRC' ? 'CRC' : storedUser?.role || null;
  });
  const inactivityTimerRef = useRef(null);

  // Login mutation
  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);

  // Toggle active role for CRC users (between CRC and STUDENT views)
  const toggleRole = useCallback(() => {
    if (user?.role === 'CRC') {
      setActiveRole(prev => prev === 'CRC' ? 'STUDENT' : 'CRC');
    }
  }, [user?.role]);

  // Logout function
  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
    setActiveRole(null);
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
      console.log("Logged out due to inactivity");
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
  }, []); // Empty deps - run once on mount

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

export const useAuth = () => useContext(AuthContext);
