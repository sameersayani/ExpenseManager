const DatePicker = ({ selectedDate, onChange, ...props }) => {
    return (
        <div className="mb-4">
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date
        </label>
      <input
        type="date"
        value={selectedDate || ""}
        onChange={(e) => onChange(e.target.value)} // Ensure the date value is passed
        {...props}
      />
          </div>
    );
  };
  
  export default DatePicker;
  