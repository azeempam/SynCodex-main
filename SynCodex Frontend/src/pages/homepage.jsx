import React from "react";
import Navbar from "../components/Navbar";
import Welcome from "../components/welcome";
import Features from "../components/features";
import Footer from "../components/footer";
import Scroll from "../components/scroll";
import useMeta from "../hooks/useMeta";

function Homepage() {
  useMeta();
  return (
    <>
      <Scroll />
      <Navbar />
      <Welcome />
      <Features />
      <Footer />
    </>
  );
}

export default Homepage;
