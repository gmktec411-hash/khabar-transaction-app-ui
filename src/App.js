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
import { fetchLatestTransactions, fetchAllTransactions, fetchNewTransactions } from "./api/transactionsApi";

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
const LOCAL_LASTID_KEY = "transactionsLastId";
const LOCAL_USER_KEY = "cachedUserId";

const AppRoutes = () => {
  const { user, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const currentUserRef = useRef(null);
  const backgroundLoadingRef = useRef(false);

  /**
   * PHASE 2: BACKGROUND LOAD - Fetch ALL data silently
   * Updates pages without blocking user
   */
  const backgroundLoad = useCallback(async () => {
    if (!user?.adminId) return;

    try {
      console.log('🔄 PHASE 2: Loading all data in background...');

      // Get ALL transactions
      const allData = await fetchAllTransactions(user.adminId);

      if (allData && allData.length > 0) {
        // Update with complete data silently
        setTransactions(allData);
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(allData));
        localStorage.setItem(LOCAL_USER_KEY, user.adminId.toString());

        // Update lastId
        const newLastId = allData[allData.length - 1].id;
        localStorage.setItem(LOCAL_LASTID_KEY, newLastId.toString());

        console.log(`✅ PHASE 2 COMPLETE: Loaded all ${allData.length} transactions`);
      }

      backgroundLoadingRef.current = false;
    } catch (err) {
      console.error("❌ Error in background load:", err);
      backgroundLoadingRef.current = false;
    }
  }, [user]);

  /**
   * PHASE 1: INSTANT LOAD - Fetch latest transactions (FAST!)
   * User sees data immediately
   */
  const instantLoad = useCallback(async () => {
    if (!user?.adminId) return;

    try {
      setIsLoading(true);
      console.log('⚡ PHASE 1: Fetching latest transactions...');

      // Get latest 100 transactions
      const latestData = await fetchLatestTransactions(user.adminId, 100);

      if (latestData && latestData.length > 0) {
        // Show latest data immediately
        setTransactions(latestData);
        console.log(`✅ PHASE 1 COMPLETE: Showing ${latestData.length} latest transactions`);
      }

      setIsLoading(false);

      // PHASE 2: Start background load (user won't notice)
      if (!backgroundLoadingRef.current) {
        backgroundLoadingRef.current = true;
        backgroundLoad();
      }
    } catch (err) {
      console.error("❌ Error in instant load:", err);
      setIsLoading(false);
    }
  }, [user, backgroundLoad]);

  /**
   * Refresh - Get only new transactions since last load
   */
  const refreshTransactions = useCallback(async () => {
    if (!user?.adminId) return;

    const lastId = localStorage.getItem(LOCAL_LASTID_KEY)
      ? parseInt(localStorage.getItem(LOCAL_LASTID_KEY), 10)
      : 0;

    try {
      setIsLoading(true);
      console.log(`🔄 REFRESH: Fetching new transactions (lastId: ${lastId})`);

      const data = await fetchNewTransactions(user.adminId, lastId);

      if (data.length === 0) {
        console.log('✅ REFRESH: No new transactions');
        setIsLoading(false);
        return;
      }

      // Append new transactions to existing cache
      const existingCache = JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY)) || [];
      const updatedCache = [...existingCache, ...data];

      console.log(`✅ REFRESH: ${data.length} new transactions (Total: ${updatedCache.length})`);

      // Update state and cache
      setTransactions(updatedCache);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updatedCache));

      // Update lastId
      if (updatedCache.length > 0) {
        const newLastId = updatedCache[updatedCache.length - 1].id;
        localStorage.setItem(LOCAL_LASTID_KEY, newLastId.toString());
        console.log(`Updated lastId: ${newLastId}`);
      }
    } catch (err) {
      console.error("❌ Error refreshing transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load transactions on user login
  useEffect(() => {
    if (!user?.adminId) {
      // User logged out, reset state
      hasLoadedRef.current = false;
      currentUserRef.current = null;
      backgroundLoadingRef.current = false;
      setTransactions([]);
      return;
    }

    // Check if we already loaded data for this user in this session
    if (hasLoadedRef.current && currentUserRef.current === user.adminId) {
      return;
    }

    const cachedUserId = localStorage.getItem(LOCAL_USER_KEY);
    const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);
    const hasCache = cachedUserId === user.adminId.toString() && cachedData;

    // If cache exists for this user, load it immediately
    if (hasCache) {
      try {
        const parsed = JSON.parse(cachedData);
        setTransactions(parsed);
        console.log(`📦 Loaded ${parsed.length} transactions from cache`);
        console.log('💡 Click Refresh button to check for new transactions');
      } catch (err) {
        console.error("❌ Error parsing cached data:", err);
      }
    }

    // Mark as loaded for this session
    hasLoadedRef.current = true;
    currentUserRef.current = user.adminId;

    // If no cache, perform instant load (which triggers background load)
    if (!hasCache) {
      console.log('🚀 First-time login - starting instant load...');
      instantLoad();
    }
  }, [user, instantLoad]);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("authExpiry");
      if (expiry && new Date().getTime() > parseInt(expiry, 10)) {
        logout();
        localStorage.removeItem(LOCAL_CACHE_KEY);
        localStorage.removeItem(LOCAL_LASTID_KEY);
        localStorage.removeItem(LOCAL_USER_KEY);
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
            localStorage.removeItem(LOCAL_CACHE_KEY);
            localStorage.removeItem(LOCAL_LASTID_KEY);
            localStorage.removeItem(LOCAL_USER_KEY);
          }}
          onRefresh={refreshTransactions}
          role={user.role}
        />
      )}

      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <SignupPage />}
        />
        <Route
          path="/"
          element={user ? <TransactionsTable transactions={transactions} /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user && user.role === "admin" ? <Home transactions={transactions} /> : <Navigate to="/" />}
        />
        <Route
          path="/report"
          element={user && user.role === "admin" ? <Report transactions={transactions} /> : <Navigate to="/" />}
        />
        <Route
          path="/limits"
          element={user && user.role === "admin" ? <Limits transactions={transactions} /> : <Navigate to="/" />}
        />
        <Route
          path="/email-integration"
          element={user && user.role === "admin" ? <EmailIntegration /> : <Navigate to="/" />}
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
