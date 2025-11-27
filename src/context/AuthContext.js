// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { loginUser } from "../api/transactionsApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("authUser");
    const expiry = localStorage.getItem("authExpiry");

    if (savedUser && expiry && new Date().getTime() < parseInt(expiry)) {
      setUser(JSON.parse(savedUser));
    } else {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authExpiry");
    }
  }, []);

  const login = async (username, password) => {
    const userData = await loginUser(username, password);
   
    if (userData) {
      const expiry = new Date().getTime() + 2 * 60 * 60 * 1000; // 2 hours
      localStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.setItem("authExpiry", expiry.toString());
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("authExpiry");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
