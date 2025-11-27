const AppConfig = {
  API_BASE_URL: window._env_?.API_BASE_URL || "http://localhost:8848/api",
  API_TRANSACTION_PATH: window._env_?.API_TRANSACTION_PATH || "/transactions/getAllTransactionsByAdmin"
};

export default AppConfig;
