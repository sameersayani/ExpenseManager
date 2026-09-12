import { useState, createContext, useEffect } from "react";
import {API_BASE_URL} from "./config";
export const ExpenseContext = createContext();

export const ExpenseProvider = (props) => {
  const [expense, setExpense] = useState({ data: [] });
  const [totals, setTotals] = useState({  
    actual_total_expenditure: 0,
    non_essential_expenditure: 0,
    essential_expenditure: 0
  });
  const [searchError, setSearchError] = useState("");
  const [navbarSearch, setNavbarSearch] = useState("");

  const [filters, setFilters] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (filters.month) queryParams.append("month", filters.month);
    if (filters.year) queryParams.append("year", filters.year);

    fetch(`${API_BASE_URL}/dailyexpense?${queryParams.toString()}`, {
        method: "GET",
        credentials: "include"
    })
      .then((response) => response.json())
      .then((data) => {
        setExpense({ data: data.data || [] });

        setTotals({ 
          actual_total_expenditure: Number(data.actual_total_expenditure?.replace(/,/g, "")) || 0,
          non_essential_expenditure: Number(data.non_essential_expenditure?.replace(/,/g, "")) || 0,
          essential_expenditure: Number(data.essential_expenditure?.replace(/,/g, "")) || 0
        });
      })
      .catch((error) => console.error("Error fetching expenses:", error));
  }, [filters]); 

  return (
    <ExpenseContext.Provider value={{ expense, setExpense, totals, setTotals, filters, setFilters, searchError, setSearchError, navbarSearch, setNavbarSearch }}>
      {props.children}
    </ExpenseContext.Provider>
  );
};
