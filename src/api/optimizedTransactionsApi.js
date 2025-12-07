import axios from "axios";
import AppConfig from "../config/appConfig";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Fetch latest 100 transactions for instant page load
 * This is the FIRST call - loads immediately
 */
export const fetchLatestTransactions = async (adminId, limit = 100) => {
  try {
    const response = await api.get('/khabar/transactions/v2/latest', {
      params: { adminId, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching latest transactions:', error);
    throw error;
  }
};

/**
 * Fetch dashboard summary with pre-calculated aggregates
 * Call this in background after initial load
 */
export const fetchDashboardSummary = async (adminId) => {
  try {
    const response = await api.get('/khabar/transactions/v2/dashboard', {
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

/**
 * Fetch new transactions after a specific ID (for polling/refresh)
 */
export const fetchNewTransactions = async (adminId, lastId, limit = 100) => {
  try {
    const response = await api.get('/khabar/transactions/v2/refresh', {
      params: { adminId, lastId, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching new transactions:', error);
    throw error;
  }
};

/**
 * Fetch ALL transactions (ONLY for background processing after initial load)
 * Use this ONLY when dashboard summary is not sufficient
 */
export const fetchAllTransactions = async (adminId) => {
  try {
    const response = await api.get('/khabar/transactions/v2/all', {
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

/**
 * Fetch transaction count
 */
export const fetchTransactionCount = async (adminId) => {
  try {
    const response = await api.get('/khabar/transactions/v2/count', {
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction count:', error);
    throw error;
  }
};

/**
 * Fetch paginated transactions
 */
export const fetchPaginatedTransactions = async (adminId, page = 0, size = 100) => {
  try {
    const response = await api.get('/khabar/transactions/v2/byAdminId', {
      params: { adminId, page, size }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated transactions:', error);
    throw error;
  }
};

export default {
  fetchLatestTransactions,
  fetchDashboardSummary,
  fetchNewTransactions,
  fetchAllTransactions,
  fetchTransactionCount,
  fetchPaginatedTransactions,
};
