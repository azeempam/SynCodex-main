import React from "react";
import FeatureCard from "./subComponents/featureCard";
import pairProgrammingIcon from "../assets/pair_programming_icon.svg";
import videoConferencingIcon from "../assets/video_conferencing_icon.svg";
import liveCodingIcon from "../assets/live_coding_icon.svg";

const features = [
  {
    title: "Pair Programming",
    description:
      "Code together in real time with a shared editor, enabling seamless collaboration and efficient debugging.",
    icon: pairProgrammingIcon,
  },
  {
    title: "Video Conferencing",
    description:
      "Assess candidates instantly with real-time code streaming and integrated video calls.",
    icon: videoConferencingIcon,
  },
  {
    title: "Live Coding Interview",
    description:
      "Conduct technical discussions with live coding and video calling for seamless collaboration and code reviews.",
    icon: liveCodingIcon,
  },
];

function Features() {
  return (
    <>
      <div className="bg-[#21232F] grid grid-cols-6 grid-rows-4 gap-4">
        <div className="flex items-center justify-center container m-auto col-span-full row-span-1">
          <div className="w-1/3 border-t border-[#E4E6F3]"></div>
          <h2 className="text-white text-3xl font-bold text-center px-18 font-Chakra">
            Features
          </h2>
          <div className="w-1/3 border-t border-[#E4E6F3]"></div>
        </div>

        <div className="col-span-full row-start-2 row-end-5 flex flex-wrap pb-10">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </>
  );
}

export default Features;
