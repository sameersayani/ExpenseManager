import React from "react";
import { Navigate } from "react-router-dom";

// Helper function to check login status (adjust based on your app's method of storing the auth state)
const isAuthenticated = () => {
  // For example, check localStorage or a state variable
  return localStorage.getItem("authToken") !== null; // Or whatever method you're using for auth
};

const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
