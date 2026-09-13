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
          setTotals({
            actual_total_expenditure: Number(result.actual_total_expenditure?.replace(/,/g, "")) || 0,
            non_essential_expenditure: Number(result.non_essential_expenditure?.replace(/,/g, "")) || 0,
            essential_expenditure: Number(result.essential_expenditure?.replace(/,/g, "")) || 0,
          });
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
  const handleLogout = () => {
      window.location.href = `${API_BASE_URL}/logout`; // Redirects to FastAPI logout
  };

    return(
        <Navbar bg="dark" expand="lg" variant="dark" className="app-navbar">
        <div className="container-fluid app-navbar__inner">
          {/* Brand */}
          <Navbar.Brand href="/" className="app-navbar__brand">
          <img
            src="/logo.png"  // Make sure the logo is inside the "public" folder
            alt="Logo"
            width="150"
            height="48"
          />{" "}
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
                    <div className="d-flex align-items-center">
                        {/* Welcome Message */}
                        <span style={{
                            color: "white",
                            fontWeight: "bold",
                            marginRight: "25px",
                            fontSize: "16px",
                            whiteSpace: 'nowrap'
                        }}>
                            Welcome, {user.given_name} {user.family_name} !
                        </span>

                        {/* Logout Button */}
                        <a 
                            href={`${API_BASE_URL}/logout`} 
                            style={{
                                color: "orange",
                                fontSize: "14px",
                                fontWeight: "bold",
                                textDecoration: "none",
                                cursor: "pointer",
                                marginRight: "25px",
                                transition: "color 0.3s"
                            }}
                            onMouseOver={(e) => e.target.style.color = "#ff9800"}
                            onMouseOut={(e) => e.target.style.color = "orange"}
                        >
                            Logout
                        </a>
                    </div>
                ) : (
                    <a 
                        href={`${API_BASE_URL}/login`}
                        style={{
                            color: "green",
                            fontSize: "20px",
                            fontWeight: "bold",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "color 0.3s"
                        }}
                        onMouseOver={(e) => e.target.style.color = "#4CAF50"}
                        onMouseOut={(e) => e.target.style.color = "green"}
                    >
                        Login with Google
                    </a>
                )}
            </div>
      </Navbar>
    );
}

export default NavBar;