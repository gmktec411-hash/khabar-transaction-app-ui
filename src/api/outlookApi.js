import axios from "axios";
import AppConfig from "../config/appConfig";

const OUTLOOK_API_URL = `${AppConfig.OUTLOOK_API_BASE_URL}/outlook/auth`;
const TOKEN_API_URL = `${AppConfig.OUTLOOK_API_BASE_URL}/token`;

/**
 * Get all tokens for an admin
 */
export const getTokensByAdmin = async (adminId) => {
  try {
    const response = await axios.get(`${TOKEN_API_URL}/admin/${adminId}`, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching tokens:", error);
    throw error;
  }
};

/**
 * Update token name
 */
export const updateTokenName = async (adminId, userId, emailType, name) => {
  try {
    const response = await axios.put(`${TOKEN_API_URL}/name`, null, {
      params: { adminId, userId, emailType, name },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating token name:", error);
    throw error;
  }
};

/**
 * Start Device Flow - Get device code and verification URL
 */
export const startDeviceFlow = async (adminId, userId, emailType) => {
  try {
    const response = await axios.post(`${OUTLOOK_API_URL}/device/start`, null, {
      params: { adminId, userId, emailType },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error starting device flow:", error);
    throw error;
  }
};

/**
 * Poll for Token - Get token after user authorizes
 */
export const pollForToken = async (adminId, userId, emailType, deviceCode) => {
  try {
    const response = await axios.post(`${OUTLOOK_API_URL}/device/poll`, null, {
      params: { adminId, userId, emailType, deviceCode },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error polling for token:", error);
    throw error;
  }
};

/**
 * Manual Email Check - Trigger email check manually
 */
export const manualEmailCheck = async (adminId, userId, emailType) => {
  try {
    const response = await axios.post(`${OUTLOOK_API_URL}/check`, null, {
      params: { adminId, userId, emailType },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error checking emails:", error);
    throw error;
  }
};

/**
 * Delete Token - Remove token and subscription
 */
export const deleteToken = async (adminId, userId, emailType) => {
  try {
    const response = await axios.post(`${OUTLOOK_API_URL}/token/delete`, null, {
      params: { adminId, userId, emailType },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting token:", error);
    throw error;
  }
};

/**
 * Get System Statistics
 */
export const getSystemStats = async () => {
  try {
    const response = await axios.get(`${OUTLOOK_API_URL}/stats`, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error getting stats:", error);
    throw error;
  }
};
