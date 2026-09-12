import React from "react";

export const SimpleTooltip = ({ text, tooltip }) => {
  return (
    <div className="relative group inline-block">
      {/* The element that triggers the tooltip */}
      <span className="cursor-pointer">{text}</span>

      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded-md px-2 py-1">
        {tooltip}
      </div>
    </div>
  );
};
