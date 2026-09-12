import React, { useEffect, useState } from "react";
import "./css/ExpenseType.css";
import {API_BASE_URL} from "../config";

const ExpenseTypeList = ({ onExpenseTypeChange, selectedType }) => {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/expensetype`, {
          method: "GET",
          credentials: "include"         
        });
        if (!response.ok) {
          throw new Error("Failed to fetch expense types.");
        }
        const data = await response.json();
        //const types = Array.isArray(data.data) ? data.data : [];
        setExpenseTypes(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchExpenseTypes();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-md border border-gray-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Expense Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {expenseTypes.map((type) => (
          <label
            key={type.id}
            className="flex items-center space-x-2 p-2 rounded-md border hover:bg-blue-50 cursor-pointer"
          >
            <input
              id={`expense-type-${type.id}`}
              type="radio"
              name="expense_type"
              value={type.id}
              checked={selectedType === type.id} // Check if this radio button should be selected
              onChange={() => onExpenseTypeChange(type.id)}
              className="form-radio text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">{type.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ExpenseTypeList;
