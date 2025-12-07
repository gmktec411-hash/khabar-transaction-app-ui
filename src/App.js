import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import TransactionsTable from "./components/TransactionsTable";
import Report from "./pages/Report";
import Home from "./pages/Home";
import Limits from "./pages/Limits";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/Navbar";
import InactivePlayers from "./pages/InactivePlayers";
import EmailIntegration from "./pages/EmailIntegration";
import ActivePlayers from "./pages/ActivePlayers";
import LoadingScreen from "./components/LoadingScreen";
import { fetchTransactions } from "./api/transactionsApi";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const SESSION_CACHE_KEY = "transactionsCache";
const SESSION_LASTID_KEY = "transactionsLastId";

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const currentUserRef = useRef(null);

  const refreshTransactions = useCallback(async () => {
    if (!user?.adminId) return;

    const lastId = sessionStorage.getItem(SESSION_LASTID_KEY)
      ? parseInt(sessionStorage.getItem(SESSION_LASTID_KEY), 10)
      : 0;

    try {
      setIsLoading(true);
      const data = await fetchTransactions(user.adminId, lastId);

      const existingCache = lastId
        ? JSON.parse(sessionStorage.getItem(SESSION_CACHE_KEY)) || []
        : [];

      const updatedCache = lastId ? [...existingCache, ...data] : data;

      setTransactions(updatedCache);
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(updatedCache));

      const newLastId =
        updatedCache.length > 0 ? updatedCache[updatedCache.length - 1].id : null;
      sessionStorage.setItem(SESSION_LASTID_KEY, newLastId);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
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

    // Load cached data from session storage first if available
    const cachedData = sessionStorage.getItem(SESSION_CACHE_KEY);
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
        sessionStorage.removeItem(SESSION_CACHE_KEY);
        sessionStorage.removeItem(SESSION_LASTID_KEY);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <>
      {isLoading && <LoadingScreen message="Loading transaction data..." />}

      {user && (
        <Navbar
          onLogout={() => {
            logout();
            sessionStorage.removeItem(SESSION_CACHE_KEY);
            sessionStorage.removeItem(SESSION_LASTID_KEY);
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
          path="/signup"
          element={
            user
              ? (user.role === "admin" ? <Navigate to="/" /> : <Navigate to="/transactions" />)
              : <SignupPage />
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
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
