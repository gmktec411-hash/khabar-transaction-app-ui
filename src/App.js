import React, { useEffect, useState, useContext, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import TransactionsTable from "./components/TransactionsTable";
import Report from "./pages/Report";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import InactivePlayers from "./pages/InactivePlayers";
import { fetchTransactions } from "./api/transactionsApi";

const LOCAL_CACHE_KEY = "transactionsCache";
const LOCAL_LASTID_KEY = "transactionsLastId";

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);

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

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

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
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route
          path="/"
          element={user ? <TransactionsTable transactions={transactions} /> : <Navigate to="/login" />}
        />
        <Route
          path="/report"
          element={user && user.role === "admin" ? <Report transactions={transactions} /> : <Navigate to="/" />}
        />
        <Route
          path="/inactive-players"
          element={user ? <InactivePlayers transactions={transactions} /> : <Navigate to="/login" />}
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
