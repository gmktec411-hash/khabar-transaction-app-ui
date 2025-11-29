import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import TransactionsTable from "./components/TransactionsTable";
import Report from "./pages/Report";
import Home from "./pages/Home";
import Limits from "./pages/Limits";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import InactivePlayers from "./pages/InactivePlayers";
import EmailIntegration from "./pages/EmailIntegration";
import ActivePlayers from "./pages/ActivePlayers";
import { fetchTransactions } from "./api/transactionsApi";

const LOCAL_CACHE_KEY = "transactionsCache";
const LOCAL_LASTID_KEY = "transactionsLastId";

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const hasLoadedRef = useRef(false);
  const currentUserRef = useRef(null);

  const refreshTransactions = useCallback(async () => {
    if (!user?.adminId) return;

    const lastId = localStorage.getItem(LOCAL_LASTID_KEY)
      ? parseInt(localStorage.getItem(LOCAL_LASTID_KEY), 10)
      : 0;

    try {
      const data = await fetchTransactions(user.adminId, lastId);

      const existingCache = lastId
        ? JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY)) || []
        : [];

      const updatedCache = lastId ? [...existingCache, ...data] : data;

      setTransactions(updatedCache);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updatedCache));

      const newLastId =
        updatedCache.length > 0 ? updatedCache[updatedCache.length - 1].id : null;
      localStorage.setItem(LOCAL_LASTID_KEY, newLastId);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  }, [user]);

  // Load transactions only once when user logs in
  useEffect(() => {
    if (!user?.adminId) {
      // User logged out, reset state
      hasLoadedRef.current = false;
      currentUserRef.current = null;
      setTransactions([]);
      return;
    }

    // Check if we already loaded data for this user
    if (hasLoadedRef.current && currentUserRef.current === user.adminId) {
      return;
    }

    // Load cached data first if available
    const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cachedData) {
      try {
        setTransactions(JSON.parse(cachedData));
      } catch (err) {
        console.error("Error parsing cached data:", err);
      }
    }

    // Fetch fresh data only once
    hasLoadedRef.current = true;
    currentUserRef.current = user.adminId;
    refreshTransactions();
  }, [user, refreshTransactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("authExpiry");
      if (expiry && new Date().getTime() > parseInt(expiry, 10)) {
        logout();
        localStorage.removeItem(LOCAL_CACHE_KEY);
        localStorage.removeItem(LOCAL_LASTID_KEY);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <>
      {user && (
        <Navbar
          onLogout={() => {
            logout();
            localStorage.removeItem(LOCAL_CACHE_KEY);
            localStorage.removeItem(LOCAL_LASTID_KEY);
          }}
          onRefresh={refreshTransactions}
          role={user.role}
        />
      )}

      <Routes>
        <Route
          path="/login"
          element={
            user
              ? (user.role === "admin" ? <Navigate to="/" /> : <Navigate to="/transactions" />)
              : <LoginPage />
          }
        />
        <Route
          path="/"
          element={
            user
              ? (user.role === "admin" ? <Home transactions={transactions} /> : <Navigate to="/transactions" />)
              : <Navigate to="/login" />
          }
        />
        <Route
          path="/transactions"
          element={user ? <TransactionsTable transactions={transactions} /> : <Navigate to="/login" />}
        />
        <Route
          path="/report"
          element={user && user.role === "admin" ? <Report transactions={transactions} /> : <Navigate to="/transactions" />}
        />
        <Route
          path="/limits"
          element={user && user.role === "admin" ? <Limits transactions={transactions} /> : <Navigate to="/transactions" />}
        />
        <Route
          path="/email-integration"
          element={user && user.role === "admin" ? <EmailIntegration /> : <Navigate to="/transactions" />}
        />
        <Route
          path="/inactive-players"
          element={user ? <InactivePlayers transactions={transactions} /> : <Navigate to="/login" />}
        />
        <Route
          path="/active-players"
          element={user ? <ActivePlayers transactions={transactions} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
