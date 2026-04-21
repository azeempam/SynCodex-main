import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#21232F] text-white text-center pb-7">
      <div className="w-full bg-[#3D415A] py-7 ">
        <div className="w-[60%] flex justify-around items-center flex-wrap text-center m-auto space-x-8">
          <Link to="/faq" className="text-white hover:underline">
            FAQ’s
          </Link>
          <Link to="/about" className="text-white hover:underline">
            About Us
          </Link>
          <Link to="/contact" className="text-white hover:underline">
            Contact Us
          </Link>
          <Link to="/licences" className="text-white hover:underline">
            Licences
          </Link>
        </div>
      </div>
      <p className="pt-8 text-gray-400">
        copyright © 2025 -{" "}
        <span className="font-bold text-white">SynCodex</span>
      </p>
      <p className="text-gray-400">All rights reserved.</p>
    </footer>
  );
};

export default Footer;
