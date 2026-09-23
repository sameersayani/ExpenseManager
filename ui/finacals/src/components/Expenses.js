import react from "react";
import { formatAmount } from "../utils/formatAmount";

const ExpenseRow = ({id, date, name, quantity_purchased, unit_price, amount, currency, really_needed, handleDelete, handleUpdate, openModal }) => {
    return (
        <tr className="expense-row">
            <td>{date}</td>
            <td>{name}</td>
            <td>{quantity_purchased}</td>
            <td>{formatAmount(unit_price, currency)}</td>
            <td>{formatAmount(amount, currency)}</td>
            <td>{really_needed}</td>
            <td className="expense-row__actions">
                <button onClick={() => handleUpdate(id)} className="btn btn-outline-info btn-sm">Update</button>
                <button
                    className="btn btn-danger btn-sm"
                    onClick={() => openModal(id)}>
                Delete
                </button>
                {/* <button onClick={() => handleDelete(id)} className="btn btn-outline-danger btn-sm mr-2">Delete</button> */}
            </td>
        </tr>
    );
};

export default ExpenseRow;