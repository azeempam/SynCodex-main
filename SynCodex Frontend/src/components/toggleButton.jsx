const ToggleButton = ({ isToggled, setIsToggled }) => {
  return (
    <div
      className={`w-10 h-4.5 flex items-center rounded-full cursor-pointer transition-all duration-300 ${
        isToggled ? "bg-gradient-to-b from-[#94FFF2] to-[#506DFF]" : "bg-gray-500"
      }`}
      onClick={() => setIsToggled(!isToggled)}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
          isToggled ? "translate-x-6" : "translate-x-0"
        }`}
      ></div>
    </div>
  );
};

export default ToggleButton;
