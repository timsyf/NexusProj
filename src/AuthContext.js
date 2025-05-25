import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuthState] = useState(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : { isAuthenticated: false };
  });

  const setAuth = (authData) => {
    setAuthState(authData);
    localStorage.setItem("auth", JSON.stringify(authData));
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false });
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};