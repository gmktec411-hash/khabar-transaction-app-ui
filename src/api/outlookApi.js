import axios from "axios";
import AppConfig from "../config/appConfig";
import { error } from "../utils/logger";

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
  } catch (err) {
    error("Error fetching tokens:", err);
    throw err;
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
  } catch (err) {
    error("Error updating token name:", err);
    throw err;
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
  } catch (err) {
    error("Error starting device flow:", err);
    throw err;
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
  } catch (err) {
    error("Error polling for token:", err);
    throw err;
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
  } catch (err) {
    error("Error checking emails:", err);
    throw err;
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
  } catch (err) {
    error("Error deleting token:", err);
    throw err;
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
  } catch (err) {
    error("Error getting stats:", err);
    throw err;
  }
};
