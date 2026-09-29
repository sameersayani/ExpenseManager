import {react, useContext, useState, useEffect} from "react";
import {Navbar, Nav, Form, FormControl, Button, Badge} from 'react-bootstrap';
import {Link, useNavigate} from  "react-router-dom";
import { ExpenseContext } from "../ExpenseContext";
import {API_BASE_URL} from "../config";
import "./css/Navbar.css";

const NavBar = () => {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const { expense, setExpense, totals, setTotals, setSearchError, setNavbarSearch } = useContext(ExpenseContext);
    const [user, setUser] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    
    const updateSearch = (e) => {
        setSearch(e.target.value);
    }
    
    const filterExpense = async (e) => {
      e.preventDefault()
      if (search?.length < 3) {
        setSearchError("Please enter at least 3 characters for search");
        return;
      }
      try {
        let searchTerm = search.toLowerCase()
        const response = await fetch(`${API_BASE_URL}/search-expense/${searchTerm}`, {
          method: "GET",
          credentials: "include"          
        });
        const result = await response.json();
  
        if (result.status === "OK" && result.data.length > 0) {
          setExpense({"data" : [...result.data]})
          // setTotals({
          //   actual_total_expenditure: Number(result.actual_total_expenditure?.replace(/,/g, "")) || 0,
          //   non_essential_expenditure: Number(result.non_essential_expenditure?.replace(/,/g, "")) || 0,
          //   essential_expenditure: Number(result.essential_expenditure?.replace(/,/g, "")) || 0,
          // });
          
          setTotals(result.totals_by_currency || {});
          setSearchError("");
          setNavbarSearch("y");
          navigate("/");
        } else {
          setExpense([]);
          setSearchError("No matching expenses found");
          setNavbarSearch("");
        }
      } catch (error) {
        setSearchError("An error occurred while searching. Please try again");
        setNavbarSearch("");
      }
    };

  const fetchUser = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
          method: "GET",
          credentials: "include"
        });

        if (!response.ok) throw new Error("Not authenticated");

        const data = await response.json();
        setUser(data.user);
    } catch (error) {
        setUser(null); // If not authenticated, reset user state
      }
  };

  useEffect(() => {
      fetchUser();
  }, []);

  // Logout function
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      // ignore network errors; still go to login
    }
    window.location.href = "/login";
  };

const openDeleteModal = () => {
  setShowSettings(false);
  setDeleteConfirmText("");
  setDeletePassword("");
  setDeleteError("");
  setShowDeleteModal(true);
};

const closeDeleteModal = () => {
  if (deleteLoading) return;
  setShowDeleteModal(false);
  setDeleteConfirmText("");
  setDeletePassword("");
  setDeleteError("");
};
  
const handleDeleteAccount = async () => {
  if (deleteConfirmText !== "DELETE") {
    setDeleteError("Please type DELETE to confirm.");
    return;
  }

  setDeleteLoading(true);
  setDeleteError("");

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: deletePassword || null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setDeleteError(data.detail || data.message || "Failed to delete account");
      setDeleteLoading(false);
      return;
    }

    window.location.href = "/login";
  } catch (err) {
    setDeleteError("Network error. Please try again.");
    setDeleteLoading(false);
  }
};
 
  return(
        <Navbar bg="dark" expand="lg" variant="dark" className="app-navbar">
        <div className="container-fluid app-navbar__inner">
          {/* Brand */}
          <Navbar.Brand href="/" className="app-navbar__brand flex items-center gap-3 py-1">
          {/* Modernized Smart Expense Manager Logo using inline SVG */}
          <div className="flex items-baseline tracking-wide select-none">
            {/* "SM" */}
            <span className="text-2xl font-black text-white font-sans uppercase">
              sm
            </span>
            
            {/* Innovative Geometric "A" Icon */}
            <svg 
              className="w-5 h-5 mx-[1px] inline-block self-center animate-pulse" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://w3.org"
              style={{ animationDuration: '3s' }}
            >
              {/* Upward financial growth trend combined with an 'A' shape */}
              <path 
                d="M12 3L3 18H7.5L12 9.5L16.5 18H21L12 3Z" 
                fill="#FFDF00" 
                className="drop-shadow-[0_0_6px_rgba(255,223,0,0.6)]"
              />
              <path 
                d="M8.5 14H15.5L14.5 12H9.5L8.5 14Z" 
                fill="#111827" 
              />
            </svg>

            {/* "RT" */}
            <span className="text-2xl font-black text-white font-sans uppercase mr-3">
              rt
            </span>

            {/* Elegant Vertical Divider Line */}
            <div className="h-5 w-[1px] bg-neutral-700 self-center hidden sm:block"></div>

            {/* "EXPENSE MANAGER" in single-line modern utility font */}
            <span className="text-[11px] font-semibold text-neutral-400 font-mono tracking-[0.2em] uppercase ml-3 hidden sm:inline-block transition-colors duration-300 hover:text-white">
              Expense Manager
            </span>
          </div>
        </Navbar.Brand>

          {/* Toggle for Small Screens */}
          <Navbar.Toggle aria-controls="navbar-nav" />
  
          {/* Collapsible Content */}
          <Navbar.Collapse id="navbar-nav">
            
            {/* Right-Side Form */}
            <Form className="app-navbar__form"
            onSubmit={filterExpense}
            inline="true">
              <nav className="app-navbar__links" aria-label="Primary navigation">
                <Link to="/addexpense" className="app-navbar__link app-navbar__link--primary">
                  <span aria-hidden="true">+</span> Add Expense
                </Link>
                <Link to="/ask-ai" className="app-navbar__link app-navbar__link--ai">
                  Ask AI
                </Link>
                <Link to="/dashboard" className="app-navbar__link app-navbar__link--secondary">
                  Charts
                </Link>
              </nav>
              <div className="app-navbar__search">
                <FormControl
                  type="text"
                  placeholder="Search expenses"
                  aria-label="Search expenses by product name"
                  value={search}
                  onChange={updateSearch}
                />
                <Button type="submit" className="app-navbar__search-button">
                  Search
                </Button>
              </div>
            </Form>
          </Navbar.Collapse>
        </div>
  <div className="app-navbar__account d-flex align-items-center">
  {user ? (
    <div className="d-flex align-items-center" style={{ position: "relative" }}>
      <span
        style={{
          color: "white",
          fontWeight: "bold",
          marginRight: "16px",
          fontSize: "16px",
          whiteSpace: "nowrap",
        }}
      >
        Welcome, {user.given_name} {user.family_name}!
      </span>

      {/* Settings icon + dropdown */}
      <div
        style={{ position: "relative", marginRight: "16px" }}
        onMouseEnter={() => setShowSettings(true)}
        onMouseLeave={() => setShowSettings(false)}
      >
        <button
          type="button"
          onClick={openDeleteModal}
          title="Settings"
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          }}
          aria-label="Settings"
        >
          ⚙️
        </button>

        {showSettings && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: "4px",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              minWidth: "220px",
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={handleDeleteAccount}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                color: "#dc3545",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#fff5f5")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Delete Account Permanently
            </button>
          </div>
        )}
      </div>

      <a
        href="/login"
        onClick={handleLogout}
        style={{
          color: "orange",
          fontSize: "14px",
          fontWeight: "bold",
          textDecoration: "none",
          cursor: "pointer",
          marginRight: "25px",
        }}
      >
        Logout
      </a>
    </div>
  ) : (
    <a
    href="/login"
    style={{
      color: "#39FF14",
      fontSize: "14px",
      fontWeight: "bold",
      textDecoration: "none",
      cursor: "pointer",
      marginRight: "25px",
      transition: "color 0.3s",
      whiteSpace: "nowrap",
    }}
    onMouseOver={(e) => (e.currentTarget.style.color = "#FFDF00")}
    onMouseOut={(e) => (e.currentTarget.style.color = "#39FF14")}
>
  Sign in
</a>
  )}
  </div>
  {showDeleteModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "16px",
    }}
    onClick={closeDeleteModal}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        maxWidth: "420px",
        width: "100%",
        padding: "24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#dc3545" }}>
        Delete Account Permanently
      </h2>
      <p style={{ margin: "0 0 16px", color: "#495057", fontSize: "14px", lineHeight: 1.5 }}>
        This will permanently delete your account and <strong>all expenses</strong>.
        This action cannot be undone.
      </p>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
  Password
</label>
  <input
    type="password"
    value={deletePassword}
    onChange={(e) => {
      setDeletePassword(e.target.value);
      setDeleteError("");
    }}
    placeholder="Enter your account password"
    disabled={deleteLoading}
    style={{
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #ced4da",
      borderRadius: "8px",
      fontSize: "14px",
      marginBottom: "12px",
      boxSizing: "border-box",
    }}
/>    
      <p style={{ fontSize: "12px", color: "#6c757d", margin: "0 0 12px" }}>
        Required for email/password accounts. Leave blank if you signed in with Google only.
      </p>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
        Type <span style={{ color: "#dc3545" }}>DELETE</span> to confirm
      </label>
      <input
        type="text"
        value={deleteConfirmText}
        onChange={(e) => {
          setDeleteConfirmText(e.target.value);
          setDeleteError("");
        }}
        placeholder="DELETE"
        disabled={deleteLoading}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ced4da",
          borderRadius: "8px",
          fontSize: "14px",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      {deleteError && (
        <p style={{ color: "#dc3545", fontSize: "13px", margin: "0 0 12px" }}>
          {deleteError}
        </p>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={closeDeleteModal}
          disabled={deleteLoading}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #ced4da",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteLoading || deleteConfirmText !== "DELETE"}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: deleteConfirmText === "DELETE" ? "#dc3545" : "#f1aeb5",
            color: "#fff",
            cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {deleteLoading ? "Deleting..." : "Delete Permanently"}
        </button>
      </div>
    </div>
  </div>
)}
</Navbar>
  );
}

export default NavBar;