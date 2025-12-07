import axios from "axios";
import AppConfig from "../config/appConfig";

// Authorization token for API requests
const token = "oGWc1pFEBr82no4BtiwAtw==";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
});

/**
 * Fetch latest 100 transactions for instant page load
 * This is the FIRST call - loads immediately
 *
 * FALLBACK: If v2/latest doesn't exist, fetch all and slice latest 100
 */
export const fetchLatestTransactions = async (adminId, limit = 100) => {
  try {
    // Try v2 endpoint first
    const response = await api.get('/khabar/transactions/v2/latest', {
      params: { adminId, limit }
    });
    return response.data;
  } catch (error) {
    // If v2 endpoint doesn't exist (404), fallback to v1
    if (error.response?.status === 404) {
      console.warn('v2/latest endpoint not found, using fallback method');
      try {
        // Fetch with lastId=0 and limit
        const response = await api.get('/khabar/transactions/getAllTransactionsByAdminIdAndLastId', {
          params: { adminId, lastId: 0, limit }
        });
        // Return in descending order (newest first)
        const data = response.data;
        return Array.isArray(data) ? data.reverse().slice(0, limit) : [];
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        throw fallbackError;
      }
    }
    console.error('Error fetching latest transactions:', error);
    throw error;
  }
};

/**
 * Fetch dashboard summary with pre-calculated aggregates
 * Call this in background after initial load
 *
 * FALLBACK: If v2/dashboard doesn't exist, return null (will calculate client-side)
 */
export const fetchDashboardSummary = async (adminId) => {
  try {
    const response = await api.get('/khabar/transactions/v2/dashboard', {
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    // If v2 endpoint doesn't exist, return null
    if (error.response?.status === 404) {
      console.warn('v2/dashboard endpoint not found, dashboard will calculate client-side');
      return null;
    }
    console.error('Error fetching dashboard summary:', error);
    return null; // Don't throw, just return null
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
 *
 * FALLBACK: If v2/all doesn't exist, use v1 endpoint
 */
export const fetchAllTransactions = async (adminId) => {
  try {
    // Try v2 endpoint first
    const response = await api.get('/khabar/transactions/v2/all', {
      params: { adminId }
    });
    return response.data;
  } catch (error) {
    // If v2 endpoint doesn't exist (404), fallback to v1
    if (error.response?.status === 404) {
      console.warn('v2/all endpoint not found, using v1 endpoint');
      try {
        const response = await api.get('/khabar/transactions/getAllTransactionsByAdminId', {
          params: { adminid: adminId } // Note: v1 uses 'adminid' (lowercase)
        });
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        throw fallbackError;
      }
    }
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
