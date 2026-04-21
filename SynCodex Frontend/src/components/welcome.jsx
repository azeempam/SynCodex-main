import React from "react";
import laptopImage from "../assets/home_laptop_image.webp";

const Welcome = () => {
  return (
    <section className="bg-[#21232F] bg1 text-white min-h-screen flex items-center justify-center pl-15 pr-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center  mt-8">
        {/* Left Content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold font-Chakra">
            Bridging the Gap Between <br />
            Coding and Communication.
          </h1>
          <p className="text-gray-400 mt-15 text-xl font-open-sans">
            An advanced online collaborative code editor with live text
            streaming and video calling, built for seamless technical
            interviews. Code together, communicate instantly, and tackle
            challenges in real time!
          </p>
          <div className="w-[100%] flex justify-start text-3xl mt-15">
            <p>
              Code <span className="font-Chakra font-gradient font-semibold">Together,</span><br />
              Solve <span className="font-Chakra font-gradient font-semibold">Faster,</span><br />
              Interview <span className="font-Chakra font-gradient font-semibold">Smarter.</span> <br />
            </p>
          </div>
        </div>

        {/* Right Image */}
        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-end max-md:hidden">
          <img
            src={laptopImage}
            alt="Laptop with Code"
            className="w-[80%] md:w-[90%] opacity-70 select-none pointer-events-none"
          />
        </div>
      </div>
    </section>
  );
};

export default Welcome;
