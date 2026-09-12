import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import '../charts/charts.css';
import {generateRandomColor} from './ColorHelper';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {API_BASE_URL} from "../../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const ExpenseCharts = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
  const currentYear = currentDate.getFullYear();
  const [filters, setFilters] = useState({ month: currentMonth, year: currentYear });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [chartType, setChartType] = useState('pie');
  const [chartData, setChartData] = useState({
    barData: {
      labels: [],
      datasets: [{
        label: 'Expense Amounts',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      }],
    },
    pieData: {
      labels: [],
      datasets: [{
        label: 'Expense Distribution',
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      }],
    },
    lineData: {
      labels: [],
      datasets: [{
        label: 'Expense Trends',
        data: [],
        fill: false,
        borderColor: [],
        tension: 0.1,
      }],
    },
  });

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: Number(value) }));
  };
  useEffect(() => {
    setLoading(true); 
    // Fetch data from API
    const queryParams = new URLSearchParams({
      month: filters.month,
      year: filters.year,
      _t: Date.now(), // Prevent browser caching
    });

    // if (filters.month) queryParams.append("month", filters.month);
    // if (filters.year) queryParams.append("year", filters.year);

    fetch(`${API_BASE_URL}/chart-data?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include"     
    })
      .then((response) => response.json())
      .then(data => {
        const expenseData = data.data;  // Extract the data field from the API response
        const categories = Object.keys(expenseData);

        // Initialize chart datasets
        const barData = {
          labels: [],
          datasets: [{
            label: 'Expense Amounts',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
          }],
        };

        const pieData = {
          labels: [],
          datasets: [{
            label: 'Expense Distribution',
            data: [],
            backgroundColor: [], // You can add more colors as needed
            borderWidth: 1,
          }],
        };

        const lineData = {
          labels: [],
          datasets: [{
            label: 'Expense Trends',
            data: [],
            fill: false,
            borderColor: [],
            tension: 0.1,
          }],
        };

        // Process each category to populate chart data
        categories.forEach(category => {
          const categoryData = expenseData[category];

          Object.keys(categoryData).forEach(expenseType => {
            const expenseItems = categoryData[expenseType];
            let totalAmount = 0;

            // Sum the amounts for each expense type
            const sumAmount = expenseItems.reduce((sum, expense) => sum + expense.amount, 0);

            // Assign random colors for each expense type
            const randomColor = generateRandomColor();

            // Update the bar chart data
            barData.labels.push(`${expenseType} - ${category}`);
            barData.datasets[0].data.push(sumAmount);
            barData.datasets[0].backgroundColor.push(randomColor);
            barData.datasets[0].borderColor.push(randomColor);

            // Update the pie chart data
            pieData.labels.push(`${expenseType} - ${category}`);
            pieData.datasets[0].data.push(sumAmount);
            pieData.datasets[0].backgroundColor.push(randomColor);

            // Update the line chart data
            lineData.labels.push(`${expenseType} - ${category}`);
            lineData.datasets[0].data.push(sumAmount);
            lineData.datasets[0].borderColor.push(randomColor);
          });
        });

        // Ensure the datasets and labels are set correctly, prevent undefined
        setChartData({
          barData: barData || { labels: [], datasets: [] },
          pieData: pieData || { labels: [], datasets: [] },
          lineData: lineData || { labels: [], datasets: [] },
        });
      })
      .catch(error => console.error('Error fetching data:', error));
    }, [filters]);

  // Add a check to render charts only when the data is available
  if (!chartData.barData || !chartData.pieData || !chartData.lineData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Link
        to="/"
        className="bg-blue-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 inline"
      >
        Home
      </Link>
      <h1>Expense Charts</h1>
        {/* Month & Year Dropdowns */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        {/* Month Dropdown */}
        <select name="month" value={filters.month} onChange={handleFilterChange}>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2021, i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select name="year" value={filters.year} onChange={handleFilterChange}>
          {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Chart Type Dropdown */}
        <select onChange={handleChartTypeChange} value={chartType}>
          <option value="pie">Pie Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
        </select>
        <span class="mx-4 space-y-4">&nbsp;</span>
      </div>

      {chartType === 'pie' && 
      <div className="chart-container">
      <div className="pie">
        <Pie data={chartData.pieData} options={{ responsive: true }} />
      </div>
      </div>}

      {chartType === 'bar' && 
      <div className="chart-container">
      <div className="bar">
        <Bar data={chartData.barData} options={{ responsive: true }} />
      </div></div>}
      
      {chartType === 'line' && 
      <div className="chart-container">     
      <div className="line">
        <Line data={chartData.lineData} options={{ responsive: true }} />
      </div></div>}
    </div>
  );
};

export default ExpenseCharts;
