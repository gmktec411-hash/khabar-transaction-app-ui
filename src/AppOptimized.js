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
import {
  fetchLatestTransactions,
  fetchAllTransactions,
  fetchDashboardSummary
} from "./api/optimizedTransactionsApi";

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

const LOCAL_CACHE_KEY = "transactionsCache";
const LOCAL_SUMMARY_KEY = "dashboardSummary";

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const currentUserRef = useRef(null);
  const backgroundLoadRef = useRef(false);

  /**
   * INSTANT LOAD STRATEGY:
   * 1. Load ONLY latest 100 transactions immediately (fast!)
   * 2. Show UI instantly with this data
   * 3. Load remaining data in background
   * 4. Load dashboard summary in background
   */
  const instantLoad = useCallback(async () => {
    if (!user?.adminId) return;

    try {
      setIsInitialLoading(true);

      // STEP 1: Load ONLY latest 100 transactions (FAST - shows immediately)
      const latestData = await fetchLatestTransactions(user.adminId, 100);

      // Show data immediately
      setTransactions(latestData);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(latestData));

      setIsInitialLoading(false);

      // STEP 2: Start background loading (user won't notice)
      if (!backgroundLoadRef.current) {
        backgroundLoadRef.current = true;
        backgroundLoad();
      }

    } catch (err) {
      console.error("Error in instant load:", err);
      setIsInitialLoading(false);
    }
  }, [user]);

  /**
   * BACKGROUND LOAD STRATEGY:
   * Runs after instant load completes
   * Loads all data and dashboard summary without blocking UI
   */
  const backgroundLoad = useCallback(async () => {
    if (!user?.adminId) return;

    try {
      setIsBackgroundLoading(true);

      // Run these in parallel for speed
      const [allData, summary] = await Promise.all([
        fetchAllTransactions(user.adminId),
        fetchDashboardSummary(user.adminId)
      ]);

      // Update with complete data
      setTransactions(allData);
      setDashboardSummary(summary);

      // Cache complete data
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(allData));
      localStorage.setItem(LOCAL_SUMMARY_KEY, JSON.stringify(summary));

      setIsBackgroundLoading(false);
      backgroundLoadRef.current = false;

    } catch (err) {
      console.error("Error in background load:", err);
      setIsBackgroundLoading(false);
      backgroundLoadRef.current = false;
    }
  }, [user]);

  /**
   * Manual refresh - updates with latest data
   */
  const refreshTransactions = useCallback(async () => {
    if (!user?.adminId) return;

    try {
      setIsInitialLoading(true);

      // Fetch latest data
      const latestData = await fetchLatestTransactions(user.adminId, 100);
      setTransactions(latestData);

      // Background fetch all
      backgroundLoad();

      setIsInitialLoading(false);
    } catch (err) {
      console.error("Error refreshing transactions:", err);
      setIsInitialLoading(false);
    }
  }, [user, backgroundLoad]);

  // Load data when user logs in
  useEffect(() => {
    if (!user?.adminId) {
      // User logged out, reset state
      hasLoadedRef.current = false;
      currentUserRef.current = null;
      backgroundLoadRef.current = false;
      setTransactions([]);
      setDashboardSummary(null);
      return;
    }

    // Check if we already loaded data for this user
    if (hasLoadedRef.current && currentUserRef.current === user.adminId) {
      return;
    }

    // Load cached data first (instant)
    const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
    const cachedSummary = localStorage.getItem(LOCAL_SUMMARY_KEY);

    if (cachedData) {
      try {
        setTransactions(JSON.parse(cachedData));
      } catch (err) {
        console.error("Error parsing cached data:", err);
      }
    }

    if (cachedSummary) {
      try {
        setDashboardSummary(JSON.parse(cachedSummary));
      } catch (err) {
        console.error("Error parsing cached summary:", err);
      }
    }

    // Execute instant load
    hasLoadedRef.current = true;
    currentUserRef.current = user.adminId;
    instantLoad();
  }, [user, instantLoad]);

  // Auto-logout on token expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("authExpiry");
      if (expiry && new Date().getTime() > parseInt(expiry, 10)) {
        logout();
        localStorage.removeItem(LOCAL_CACHE_KEY);
        localStorage.removeItem(LOCAL_SUMMARY_KEY);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [logout]);

  return (
    <>
      {isInitialLoading && <LoadingScreen message="Loading latest transactions..." />}

      {user && (
        <Navbar
          onLogout={() => {
            logout();
            localStorage.removeItem(LOCAL_CACHE_KEY);
            localStorage.removeItem(LOCAL_SUMMARY_KEY);
          }}
          onRefresh={refreshTransactions}
          role={user.role}
        />
      )}

      {/* Show background loading indicator */}
      {isBackgroundLoading && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(102, 126, 234, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          Loading complete data...
        </div>
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
              ? (user.role === "admin" ? <Home transactions={transactions} dashboardSummary={dashboardSummary} /> : <Navigate to="/transactions" />)
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
