// Production frontend should call production API
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://expensemanager-0ac3.onrender.com"
    : ""); // empty = same origin via proxy