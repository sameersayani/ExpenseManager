import React, { createContext, useContext, useState } from "react";
import {API_BASE_URL} from "./config";

const UpdateExpenseContext = createContext();

export const useUpdateExpenseContext = () => useContext(UpdateExpenseContext);

export const UpdateExpenseProvider = ({ children }) => {
    const [expenseData, setExpenseData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load single expense by ID
    const loadExpense = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dailyexpense/${id}`, {
                method: "GET",
                credentials: "include"
            });
            if (!response.ok) throw new Error("Failed to load expense.");

            const data = await response.json();
            console.log("Fetched Expense Data:", data); // Debugging log
            if (!data.data) throw new Error("Invalid response format: Missing 'data' field");

            setExpenseData({
                ...data,
                expense_type_id: data.data.expense_type_id || null, // Ensure expense_type_id is present
            });

        } catch (err) {
            console.error("Error loading expense:", err);
            setExpenseData(null);
        } finally {
            setLoading(false);
        }
    };

    // Update an expense
    const updateExpense = async (id, updatedData) => {
        try {
            if (!updatedData.expense_type_id) {
                console.error("Missing expense_type_id");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/dailyexpense/${id}` , {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({
                    date: updatedData.date,
                    name: updatedData.name,
                    quantity_purchased: updatedData.quantity_purchased,
                    unit_price: updatedData.unit_price,
                    amount: updatedData.amount,
                    really_needed: updatedData.really_needed,
                    expense_type_id: updatedData.expense_type_id
                }),
            });

            if (!response.ok) throw new Error(`Failed to update expense: ${response.statusText}`);

            const result = await response.json();
            console.log('Expense updated successfully:', result);

            return result;
        } catch (err) {
            console.error('Error updating expense:', err);
            throw err;
        }
    };

    return (
        <UpdateExpenseContext.Provider value={{ expenseData, loadExpense, updateExpense, loading }}>
            {children}
        </UpdateExpenseContext.Provider>
    );
};
