import React, { useEffect, useContext, useState } from "react";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ExpenseTypeContext } from "../ExpenseTypeContext";
import { ExpenseContext } from "../ExpenseContext";
import ExpenseRow from "./Expenses";
import { useUpdateExpenseContext } from "../UpdateExpenseContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import DownloadReportModal from "./DownloadReportModal";
import "./css/ExpenseList.css";
import {API_BASE_URL} from "../config";
import { formatAmount } from "../utils/formatAmount"; // Import the formatAmount function
import { useCurrency } from "../hooks/useCurrency";

const ExpensesList = () => {
  const [expenseType, setExpenseType] = useContext(ExpenseTypeContext);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const { loadExpense } = useUpdateExpenseContext(); // Use loadExpense from the context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useCurrency();
  
  // State to manage showing/hiding totals (hidden by default)
  const [showTotals, setShowTotals] = useState(false);

  // Initialize current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
  const currentYear = currentDate.getFullYear();
  const { expense, setExpense, totals, setTotals, filters, setFilters, searchError, setSearchError, setNavbarSearch} = useContext(ExpenseContext);

  const actualTotalExpenditure = totals?.actual_total_expenditure || "0";
  const nonEssentialExpenditure = totals?.non_essential_expenditure || "0";
  const essentialExpenditure = totals?.essential_expenditure || "0";

  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  let navigate = useNavigate();

  const openModal = (expenseId) => {
    const expen = expense.data.find((expense) => expense.id === expenseId);
    setExpenseToDelete(expen);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExpenseToDelete(null);
  };

  //Clear error when component mounts
  useEffect(() => {
    setSearchError(""); // Clear error when ExpensesList loads
  }, []); // Runs only on mount

  useEffect(() => {
    handleSearch(); // Fetch latest expenses whenever refreshTrigger updates
  }, [refreshTrigger]); 
  
  const handleSearch = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dailyexpense?month=${filters.month}&year=${filters.year}`, {
        method: "GET",
        credentials: "include"          
        }
      );
      const result = await response.json();

      setExpense({
        data: [...result.data] || [],
      });

      setTotals(result.totals_by_currency || {});
      setSearchError("")
      setNavbarSearch("")
    } catch (error) {
      console.error("Error fetching filtered expenses:", error);
    }
  };
  
  const handleDelete = () => {
    if (!expenseToDelete) return;

    fetch(`${API_BASE_URL}/dailyexpense/${expenseToDelete.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status === "OK") {
          const updatedExpenses = expense.data.filter(
            (expense) => expense.id !== expenseToDelete.id
          );
          setExpense({
            ...expense, // Keep existing totals
            data: updatedExpenses, // Update only the data array
          });

          setSearchError("")
          setNavbarSearch("")
          setRefreshTrigger((prev) => prev + 1);
        } else {
          alert("Failed to delete the expense !");
        }
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        closeModal(); // Close the modal after operation
      });
  };

  const handleUpdate = (id) => {
    loadExpense(id); // Use loadExpense to populate the context with the data
    navigate(`/updateexpense/${id}`); // Navigate to the Update Expense page
  };

  const fetchExpenses = () => {
    const queryParams = new URLSearchParams();

    if (filters.month) queryParams.append("month", filters.month);
    if (filters.year) queryParams.append("year", filters.year);

    fetch(`${API_BASE_URL}/dailyexpense?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include"      
    })
      .then((response) => response.json())
      .then((result) => {
        setExpense({
          data: [...result.data],
          actual_total_expenditure: result.actual_total_expenditure || 0,
          non_essential_expenditure: result.non_essential_expenditure || 0,
          essential_expenditure: result.essential_expenditure || 0,
        });
      setTotals(result.totals_by_currency || {});
        setRefreshTrigger((prev) => prev + 1);
      })
      .catch((error) => console.error("Error fetching expenses:", error));
  };
  
 useEffect(() => {
  fetchExpenses();  // Fetch data when filters change
}, [filters.month, filters.year]); 


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="expense-page">
    {/* Filter Section */}
    <section className="expense-toolbar">
    <div className="expense-filters">
      <div>
        <label htmlFor="month" className="block text-sm font-medium text-gray-700">
          Month
        </label>
        <select
          id="month"
          value={filters.month}
          onChange={(e) =>
            setFilters({ ...filters, month: parseInt(e.target.value) })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index} value={index + 1}>
              {new Date(0, index).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">
          Year
        </label>
        <select
          id="year"
          value={filters.year}
          onChange={(e) =>
            setFilters({ ...filters, year: parseInt(e.target.value) })
          }
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {/* Add options for years */}
          {Array.from({ length: 10 }, (_, index) => (
            <option key={index} value={new Date().getFullYear() - index}>
              {new Date().getFullYear() - index}
            </option>
          ))}
        </select>
      </div>
      <div className="expense-filter-action">
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 self-end"
      >
        Search
      </button>
      </div>
      <div className="expense-filter-action">
      {/* Download Report Button */}
        <button
          onClick={() => setDownloadModalOpen(true)}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Download Report
        </button>

        {/* Render the Modal */}
        <DownloadReportModal
          isOpen={isDownloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
        />  
      </div>
    </div>

      <p className="expense-filter-summary">
        Showing results for:{" "}
        <strong>
          {`Month: ${new Date(0, filters.month - 1).toLocaleString("en-US", {
            month: "long",
          })}, Year: ${filters.year}`}
        </strong>
      </p>
    </section>

    {searchError && <p className="expense-error">{searchError}</p>}
    {/* Expenses Table */}
    <div className="fixed-table-container expense-table-wrap">
      <Table striped bordered hover className="shadow-md">
        <thead>
          <tr>
            <th>Expense Date</th>
            <th>Product Name</th>
            <th>Quantity Purchased</th>
            <th>Unit Price</th>
            <th>Amount</th>
            <th>Really Needed?</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expense?.data?.length > 0 ? (
            expense.data.map((expense) => (
              <ExpenseRow
                key={expense.id}
                id={expense.id}
                date={expense.date ? expense.date.split("T")[0] : ""}
                name={expense.name}
                quantity_purchased={expense.quantity_purchased}
                unit_price={expense.unit_price}
                amount={expense.amount}
                currency={expense.currency}
                really_needed={expense.really_needed ? "yes" : "no"}
                handleDelete={handleDelete}
                handleUpdate={handleUpdate}
                openModal={openModal}
              />
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                No records found
              </td>
            </tr>
          )}
        </tbody>
        
        {expense?.data?.length > 0 ? (
          <tfoot>
            {/* Accordion Toggle Row */}
            <tr 
              onClick={() => setShowTotals(!showTotals)} 
              style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
            >
              <td colSpan={7} className="text-center py-2">
                <span style={{ color: "#007bff", fontWeight: "600", userSelect: "none" }}>
                  {showTotals ? "Hide Totals ▲" : "Show Totals ▼"}
                </span>
              </td>
            </tr>

            {/* Conditionally reveal rows based on state */}
            {showTotals && (
              Object.keys(totals || {}).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">
                    No totals available
                  </td>
                </tr>
              ) : (
                Object.entries(totals).map(([currency, values]) => (
                  <React.Fragment key={currency}>
                    {/* Actual Total */}
                    <tr>
                      <td colSpan={3}></td>
                      <td>
                        <strong>Actual Total ({currency})</strong>
                      </td>
                      <td>
                        <strong>{formatAmount(values.actual, currency)}</strong>
                      </td>
                      <td colSpan={2}></td>
                    </tr>

                    {/* Overspend */}
                    <tr>
                      <td colSpan={3}></td>
                      <td style={{ color: "#FF0000" }}>
                        <strong>Overspend ({currency})</strong>
                      </td>
                      <td style={{ color: "#FF0000" }}>
                        <strong>{formatAmount(values.non_essential, currency)}</strong>
                      </td>
                      <td colSpan={2}></td>
                    </tr>

                    {/* Desired Total */}
                    <tr>
                      <td colSpan={3}></td>
                      <td style={{ color: "#0000FF" }}>
                        <strong>Desired Total ({currency})</strong>
                      </td>
                      <td style={{ color: "#0000FF" }}>
                        <strong>{formatAmount(values.essential, currency)}</strong>
                      </td>
                      <td colSpan={2}></td>
                    </tr>

                    {/* Spacer row between currencies */}
                    <tr>
                      <td colSpan={7} style={{ height: "8px", border: "none" }}></td>
                    </tr>
                  </React.Fragment>
                ))
              )
            )}
          </tfoot>
        ) : (
          <tfoot></tfoot>
        )}
      </Table>
    </div>

    {/* Confirm Delete Modal */}
    <ConfirmDeleteModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onConfirm={handleDelete}
      itemName={expenseToDelete?.name || "this item"}
    />
  </main>
  );
};

export default ExpensesList;
