import React, { useState } from "react";

const FilterExpenses = ({ onSearch }) => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const handleSearch = () => {
    onSearch({ month, year });
  };

  return (
    <div className="filter-container">
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="">Select Month</option>
        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
        <option value="4">April</option>
        <option value="5">May</option>
        <option value="6">June</option>
        <option value="7">July</option>
        <option value="8">August</option>
        <option value="9">September</option>
        <option value="10">October</option>
        <option value="11">November</option>
        <option value="12">December</option>
      </select>

      <select value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">Select Year</option>
        <option value="2023">2023</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>

      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default FilterExpenses;
