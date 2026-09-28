import React, { useState } from "react";
import Modal from "react-modal";
import {API_BASE_URL} from "../config";

// Ensure modal is attached to root element
Modal.setAppElement("#root");

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dim background
    zIndex: 1000, // Ensure modal is above table
  },
  content: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    height: "auto",
    borderRadius: "8px",
    padding: "20px",
    background: "white",
    outline: "none",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
  },
};

const DownloadReportModal = ({ isOpen, onClose }) => {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  const handleDownload = async () => {
  try {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);

    // Important: hit backend explicitly in local if API_BASE_URL is ""
    const backendOrigin =
      process.env.REACT_APP_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://expensemanager-0ac3.onrender.com"
        : "http://127.0.0.1:8000");

    const url = `${backendOrigin}/download-report?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include", // send session cookie
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || err.detail || "Failed to download report");
      return;
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `expenses_${year}${month ? `_${month}` : ""}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (e) {
    console.error(e);
    // alert("Download failed. Please try again.");
  }
};

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles}>
      <div>
        <h2 className="text-lg font-semibold mb-4">Download Report</h2>
        <div className="flex flex-col space-y-4">
          {/* Year Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, index) => (
                <option key={index} value={new Date().getFullYear() - index}>
                  {new Date().getFullYear() - index}
                </option>
              ))}
            </select>
          </div>

          {/* Month Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Month (Optional)</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(0, index).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          {/* Download Button */}
          {year && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {month ? "Download Monthly Report" : "Download Yearly Report"}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadReportModal;
