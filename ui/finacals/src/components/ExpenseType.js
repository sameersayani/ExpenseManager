import React, { useEffect, useState } from "react";
import "./css/ExpenseType.css";
import {API_BASE_URL} from "../config";

const ExpenseTypeList = ({ onExpenseTypeChange, selectedType, errorMessage }) => {
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
    <div className="expense-type-selector">
      <label htmlFor="expense-type" className="expense-type-selector__label">
        Expense Type
      </label>
      <select
        id="expense-type"
        name="expense_type"
        value={selectedType || ""}
        onChange={(event) => onExpenseTypeChange(event.target.value ? Number(event.target.value) : null)}
        className="expense-type-selector__select"
      >
        <option value="" disabled>Select expense type</option>
        {expenseTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      {errorMessage && <p className="expense-type-selector__error">{errorMessage}</p>}
    </div>
  );
};

export default ExpenseTypeList;
