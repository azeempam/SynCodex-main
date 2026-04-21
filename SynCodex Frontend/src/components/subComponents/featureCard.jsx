const FeatureCard = ({ title, description, icon }) => {
  return (
    <div className="p-6 text-center max-w-xs mx-auto">
      <div className="flex justify-center mb-4">
        <img src={icon} alt={title} className="w-44 h-44 select-none pointer-events-none" />
      </div>
      <h3 className="text-white text-lg font-bold my-7 font-Chakra">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
