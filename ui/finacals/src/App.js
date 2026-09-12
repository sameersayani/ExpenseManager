import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import NavBar from './components/Navbar';
import { ExpenseTypeProvider } from "./ExpenseTypeContext";
import AddExpenseForm from "./components/AddExpense";
import { ExpenseProvider } from "./ExpenseContext";
import ExpensesList from "./components/ExpensesList";
import { UpdateExpenseProvider } from "./UpdateExpenseContext";
import UpdateExpenseForm from "./components/UpdateExpense";
import Dashboard from "./components/Dashboard";
import Parent, { Child } from "./test";
import {API_BASE_URL} from "./config";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation(); // Get the current URL
  const navigate = useNavigate(); // To navigate after login

  useEffect(() => {
    // Check if user is already authenticated (e.g., check token in localStorage)
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
    }
  
    // Check if the app is on the callback URL after the Google login process
    if (location.pathname === "/auth/callback") {
      // Extract the authorization code or token from the URL query params
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");

      if (code) {
        // Call an API to exchange the code for an access token
        fetchTokenFromCode(code);
      }
    }
  }, [location]); // Re-run effect when location changes

  const fetchTokenFromCode = async (code) => {
    try {
      // Call your backend API to exchange the code for an access token
      const response = await fetch(`${API_BASE_URL}/api/auth/callback?code=${code}`);
      const data = await response.json();
      
      if (data.access_token) {
        // Save token in localStorage
        localStorage.setItem("access_token", data.access_token);
        setIsAuthenticated(true);
        navigate("/"); // Redirect to the main page or dashboard
      } else {
        // Handle error (e.g., token exchange failed)
        console.error("Failed to authenticate user");
      }
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  return (
    <div>
      {/* {isAuthenticated ? ( */}
        <ExpenseTypeProvider>
          <ExpenseProvider>
            <NavBar />
            <div className="row">
              <div className="col-sm-10 col-xm-12 mr-auto ml-auto mt-4 mb-4">
                <UpdateExpenseProvider>
                  <Routes>
                    <Route path="/" element={<ExpensesList />} />
                    <Route path="/addExpense" element={<AddExpenseForm />} />
                    <Route path="/updateExpense/:id" element={<UpdateExpenseForm />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/test" element={<Parent />} />
                    <Route path="/test" element={<Child />} />
                  </Routes>
                </UpdateExpenseProvider>
              </div>
            </div>
          </ExpenseProvider>
        </ExpenseTypeProvider>
      {/* ) : (
        <Routes>
          <Route path="*" element={<GoogleLogin setIsAuthenticated={setIsAuthenticated} />} />
        </Routes>
      )} */}
    </div>
  );
}

export default App;
