import React from "react";
import { CURRENCIES } from "../constants/currencies";

const CurrencySelect = ({ value = "", onChange, error }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Currency <span className="text-red-500">*</span>
      </label>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select Currency</option>
        {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </option>
      ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CurrencySelect;