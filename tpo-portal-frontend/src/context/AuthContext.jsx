import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    isAuthenticated: false,
    token: null,
    role: null,
  });

  // Initialize from localStorage on page load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (storedToken && storedRole) {
      try {
        const decoded = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setUser({
            isAuthenticated: true,
            token: storedToken,
            role: storedRole,
          });
        } else {
          // Token expired
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      } catch (err) {
        console.error("Invalid stored token:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    }
  }, []);

  // Login and persist user data
  const login = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setUser({ isAuthenticated: true, token, role });
  };

  // Logout and clear data
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser({ isAuthenticated: false, token: null, role: null });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);
