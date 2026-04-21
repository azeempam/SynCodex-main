// IconButton.jsx
import React from "react";

const IconButton = ({
  icon,
  iconColor,
  buttonColor = "bg-[#181920]",
  onClick,
  label = "",
}) => {
  return (
    <div className="relative group inline-block">
      <button
        onClick={onClick}
        className={`p-3 sm:p-2 md:p-3 lg:p-3 rounded-lg sm:rounded-md md:rounded-lg ${buttonColor} hover:opacity-90 transition`}
      >
        <span className={`${iconColor}`}>
          <img src={icon} alt="call-tool" className="w-5 h-5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </span>
      </button>

      {label && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm px-2 py-1 rounded shadow z-10 whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
};

export default IconButton;
