import axios from "axios";
import AppConfig from "../config/appConfig";

const API_BASE_URL = AppConfig.API_BASE_URL;
const API_LATEST_TRANSACTIONS = "/khabar/transactions/v2/latest";
const API_ALL_TRANSACTIONS = "/khabar/transactions/v2/all";
const API_REFRESH_TRANSACTIONS = "/khabar/transactions/v2/refresh";
const token = "oGWc1pFEBr82no4BtiwAtw==";

/**
 * Fetch latest transactions for instant display (PHASE 1 - FAST)
 * @param {string} adminId - Admin user ID
 * @param {number} limit - Number of latest transactions (default 100)
 * @returns {Promise<Array>} Latest transaction data
 */
export const fetchLatestTransactions = async (adminId, limit = 100) => {
  try {
    const url = `${API_BASE_URL}${API_LATEST_TRANSACTIONS}`;
    console.log(`⚡ API Call: ${API_LATEST_TRANSACTIONS} (adminId: ${adminId}, limit: ${limit})`);

    const response = await axios.get(url, {
      params: { adminId, limit },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log(`✅ Latest API Response: Received ${response.data?.length || 0} transactions`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching latest transactions:", error);
    throw error;
  }
};

/**
 * Fetch ALL transactions for background load (PHASE 2 - COMPLETE DATA)
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Array>} All transaction data
 */
export const fetchAllTransactions = async (adminId) => {
  try {
    const url = `${API_BASE_URL}${API_ALL_TRANSACTIONS}`;
    console.log(`🔄 API Call: ${API_ALL_TRANSACTIONS} (adminId: ${adminId})`);

    const response = await axios.get(url, {
      params: { adminId, lastId: 0 },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log(`✅ All Data Response: Received ${response.data?.length || 0} transactions`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching all transactions:", error);
    throw error;
  }
};

/**
 * Fetch new transactions after specific ID (for refresh)
 * @param {string} adminId - Admin user ID
 * @param {number} lastId - Last transaction ID
 * @returns {Promise<Array>} New transaction data
 */
export const fetchNewTransactions = async (adminId, lastId) => {
  try {
    const url = `${API_BASE_URL}${API_REFRESH_TRANSACTIONS}`;
    console.log(`🔄 API Call: ${API_REFRESH_TRANSACTIONS} (adminId: ${adminId}, lastId: ${lastId})`);

    const response = await axios.get(url, {
      params: { adminId, lastId },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log(`✅ Refresh Response: Received ${response.data?.length || 0} new transactions`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching new transactions:", error);
    throw error;
  }
};

export const loginUser = async (username, password) => {
  try {

    const response = await axios.post(
      `${AppConfig.API_BASE_URL}/users/login`,
      { username, password }, // <-- request body
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // optional
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return null;
  }
};

