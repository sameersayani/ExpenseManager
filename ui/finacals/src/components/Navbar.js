import {react, useContext, useState, useEffect} from "react";
import {Navbar, Nav, Form, FormControl, Button, Badge} from 'react-bootstrap';
import {Link} from  "react-router-dom";
import { ExpenseContext } from "../ExpenseContext";
import {API_BASE_URL} from "../config";

const NavBar = () => {
    const [search, setSearch] = useState("");
    const { expense, setExpense, totals, setSearchError, setNavbarSearch } = useContext(ExpenseContext);
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
          setSearchError("");
          setNavbarSearch("y");
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
        <Navbar bg="dark" expand="lg" variant="dark">
        <div className="container-fluid">
          {/* Brand */}
          <Navbar.Brand href="/"> 
          <img
            src="/logo.png"  // Make sure the logo is inside the "public" folder
            alt="Logo"
            width="150"
            height="100"
          />{" "}
          </Navbar.Brand>
  
          {/* Toggle for Small Screens */}
          <Navbar.Toggle aria-controls="navbar-nav" />
  
          {/* Collapsible Content */}
          <Navbar.Collapse id="navbar-nav">
            
            {/* Right-Side Form */}
            <Form className="d-flex align-items-center" 
            style={{ width: '70%' }}
            onSubmit={filterExpense}
            inline="true">
              Add New Expense
              <Link
                to="/addexpense"
                className="rounded-md bg-blue-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-blue-700 focus:shadow-none active:bg-blue-700 hover:bg-blue-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2"
                style={{ whiteSpace: 'nowrap' }}
              >
                Add Expense
              </Link>
              <Navbar.Brand>
                <Link
                to="dashboard"
                className="rounded-md bg-green-600 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-green-700 focus:shadow-none active:bg-green-700 hover:bg-green-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2"
                style={{ whiteSpace: 'nowrap' }}
                >
                Show Charts
                </Link>
                </Navbar.Brand>
              Search Bar
              <FormControl
                type="text"
                placeholder="Search by product name"
                className="me-3"
                style={{ minWidth: '10px' }}
                value={search}
                onChange={updateSearch}
              />
  
              {/* Search Button */}
              <Button type="submit" 
              variant="outline-primary"
              onChange={updateSearch}
              >
                Search
              </Button>
            </Form>
          </Navbar.Collapse>
        </div>
        <div className="d-flex align-items-center">
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