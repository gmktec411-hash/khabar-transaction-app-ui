import axios from "axios";
import AppConfig from "../config/appConfig";

const API_URL = `${AppConfig.API_BASE_URL}${AppConfig.API_TRANSACTION_PATH}`;
const token = "oGWc1pFEBr82no4BtiwAtw==";
export const fetchTransactions = async (adminId, lastId = 0n) => {
  try {


    const response = await axios.get(API_URL, {
      params: { adminId, lastId },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
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

