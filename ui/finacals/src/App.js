import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import NavBar from './components/Navbar';
import { ExpenseTypeProvider } from "./ExpenseTypeContext";
import AddExpenseForm from "./components/AddExpense";
import { ExpenseProvider } from "./ExpenseContext";
import ExpensesList from "./components/ExpensesList";
import { UpdateExpenseProvider } from "./UpdateExpenseContext";
import UpdateExpenseForm from "./components/UpdateExpense";
import Dashboard from "./components/Dashboard";
import AiChat from "./components/AiChat";
import Parent, { Child } from "./test";
import { API_BASE_URL } from "./config";
import PrivacyPolicy from './components/PrivacyPolicy';
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false); // Track banner visibility
  const location = useLocation(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsAuthenticated(true);
    }
  
    if (location.pathname === "/auth/callback") {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");

      if (code) {
        fetchTokenFromCode(code);
      }
    }

    // Check if the user has already accepted cookies
    const cookieConsent = localStorage.getItem("cookie_consent_accepted");
    if (!cookieConsent) {
      setShowCookieBanner(true);
    }
  }, [location]); 

  const fetchTokenFromCode = async (code) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/callback?code=${code}`);
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        setIsAuthenticated(true);
        navigate("/"); 
      } else {
        console.error("Failed to authenticate user");
      }
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };

  // Function to handle cookie acceptance
  const handleAcceptCookies = () => {
    localStorage.setItem("cookie_consent_accepted", "true");
    setShowCookieBanner(false);
  };

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ExpenseTypeProvider>
        <ExpenseProvider>
          <NavBar />
          <div className="app-content" style={{ flex: 1 }}>
              <UpdateExpenseProvider>
                <Routes>
                  <Route path="/" element={<ExpensesList />} />
                  <Route path="/addExpense" element={<AddExpenseForm />} />
                  <Route path="/updateExpense/:id" element={<UpdateExpenseForm />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/ask-ai" element={<AiChat />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/test" element={<Parent />} />
                  <Route path="/test" element={<Child />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </UpdateExpenseProvider>
            </div>
            
            {/* Cookie Consent Banner */}
            {showCookieBanner && (
              <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '15px 25px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                zIndex: 1000,
                width: '90%',
                maxWidth: '600px',
                border: '1px solid #e9ecef'
              }}>
                <span style={{ fontSize: '14px', color: '#495057', lineHeight: '1.4' }}>
                  We use cookies to secure your authentication session and optimize your local tracking experience. 
                  Read our <Link to="/privacy" style={{ color: '#007bff', textDecoration: 'underline' }}>Privacy Policy</Link> for details.
                </span>
                <button 
                  onClick={handleAcceptCookies}
                  style={{
                    backgroundColor: '#007bff',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    fontSize: '13px'
                  }}
                >
                  Accept
                </button>
              </div>
            )}

            {/* Persistent Footer Component */}
            <footer style={{
              textAlign: 'center', 
              padding: '15px 0', 
              background: '#f8f9fa', 
              borderTop: '1px solid #e9ecef',
              marginTop: '20px'
            }}>
              <span style={{ color: '#6c757d', fontSize: '14px' }}>
                © 2026 Expense Manager. All rights reserved. | 
                <Link to="/privacy" style={{ marginLeft: '5px', color: '#007bff', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
              </span>
            </footer>

        </ExpenseProvider>
      </ExpenseTypeProvider>
    </div>
  );
}

export default App;
