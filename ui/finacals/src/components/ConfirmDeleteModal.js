import React from "react";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null; // Don't render anything if the modal is not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p className="mb-6">Are you sure you want to delete this expense?</p>
        <div className="flex justify-end space-x-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
