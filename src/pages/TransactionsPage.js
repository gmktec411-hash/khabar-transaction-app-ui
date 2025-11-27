import React, { useEffect, useState } from "react";
import { fetchTransactions } from "../api/transactionsApi";
import TransactionsTable from "../components/TransactionsTable";
import Navbar from "../components/Navbar";

const LOCAL_STORAGE_KEY = "transactionsCache";

const TransactionsPage = ({ adminId, role }) => {
  const [transactionsCache, setTransactionsCache] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: get lastId directly from localStorage
  const getLastIdFromStorage = () => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return parsed.length > 0 ? parsed[parsed.length - 1].id : null;
  };

  // Load initial data
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const lastId = getLastIdFromStorage();
        console.log("[DEBUG] Initial load, lastId from storage =", lastId);

        const data = await fetchTransactions(adminId, lastId);
        console.log("[DEBUG] Initial load fetched length =", data.length);

        const updatedCache = lastId ? [...JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)), ...data] : data;
        setTransactionsCache(updatedCache);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCache));
        console.log("[DEBUG] LocalStorage updated, lastId =", updatedCache.length > 0 ? updatedCache[updatedCache.length - 1].id : null);
      } catch (err) {
        console.error("[DEBUG] Error initial load:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [adminId]);

  // Refresh handler
  const handleRefresh = async () => {
    try {
      const lastId = getLastIdFromStorage();
      console.log("[DEBUG] Refresh clicked, lastId =", lastId);

      const newData = await fetchTransactions(adminId, lastId);
      console.log("[DEBUG] Fetched newData length =", newData.length);

      if (newData.length > 0) {
        const updatedCache = [...JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)), ...newData];
        setTransactionsCache(updatedCache);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCache));
        console.log("[DEBUG] LocalStorage updated after refresh, lastId =", updatedCache[updatedCache.length - 1].id);
      }
    } catch (err) {
      console.error("[DEBUG] Error refreshing:", err);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setTransactionsCache([]);
    console.log("[DEBUG] LocalStorage cleared on logout");
    // Add actual logout logic (redirect, clear token, etc.)
  };

  if (loading) return <p className="text-gray-500">Loading transactions...</p>;

  return (
    <>
      <Navbar onRefresh={handleRefresh} onLogout={handleLogout} role={role} />
      <TransactionsTable transactions={transactionsCache} />
    </>
  );
};

export default TransactionsPage;
