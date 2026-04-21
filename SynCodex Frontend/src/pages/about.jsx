import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import Scroll from "../components/scroll";
import useMeta from "../hooks/useMeta";

const AboutPage = () => {
  useMeta();

  return (
    <>
      <Scroll />

      <Navbar />

      <div className="bg-[#21232f] text-white min-h-screen py-12 px-6 md:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-cyan-400 font-Chakra">
            Introduction
          </h1>
          <p className="mt-4 text-lg text-gray-300 font-open-sans">
            SynCodex is an advanced real-time collaborative code editor with
            live text streaming and video calling. Designed for seamless
            technical interviews, pair programming, and remote coding
            collaboration.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold text-cyan-300 font-Chakra">
            Mission & Vision
          </h2>
          <p className="mt-2 text-gray-300 font-open-sans">
            <strong>Mission:</strong> To provide a powerful, interactive coding
            platform that enhances real-time collaboration and technical
            assessments.
          </p>
          <p className="text-gray-300 font-open-sans">
            <strong>Vision:</strong> To revolutionize the way coding interviews
            and teamwork happen with seamless integration of live coding and
            communication tools.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold text-cyan-300 font-Chakra">
            Key Features
          </h2>
          <ul className="mt-4 space-y-3 text-gray-300 font-open-sans">
            <li>
              ✅ <strong>Live Code Streaming:</strong> Instantly share and edit
              code in real-time.
            </li>
            <li>
              ✅ <strong>Integrated Video Calling:</strong> Conduct interviews
              without switching platforms.
            </li>
            <li>
              ✅ <strong>Pair Programming Support:</strong> Work together
              efficiently on coding problems.
            </li>
            <li>
              ✅ <strong>Real-Time Collaboration:</strong> Multiple users can
              code together seamlessly.
            </li>
            <li>
              ✅ <strong>Secure & Scalable:</strong> Built with WebRTC,
              WebSocket, and MongoDB for reliability and speed.
            </li>
          </ul>
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-semibold text-cyan-300 font-Chakra">
            Who Can Use SynCodex?
          </h2>
          <ul className="mt-4 space-y-3 text-gray-300 font-open-sans">
            <li>
              👨‍💻 <strong>Interviewers & Hiring Teams:</strong> Conduct technical
              coding interviews efficiently.
            </li>
            <li>
              🚀 <strong>Developers & Teams:</strong> Collaborate on projects
              with live code sharing.
            </li>
            <li>
              🎓 <strong>Students & Educators:</strong> Learn and teach coding
              in a real-time interactive environment.
            </li>
          </ul>
        </div>

        <div className="max-w-4xl mx-auto mt-12 text-center">
          <h2 className="text-2xl font-semibold text-cyan-300 font-Chakra">
            Why Choose SynCodex?
          </h2>
          <p className="mt-4 text-gray-300 font-open-sans">
            ✔ Eliminates the hassle of switching between multiple tools.
          </p>
          <p className="text-gray-300 font-open-sans">
            ✔ Provides a professional and interactive coding experience.
          </p>
          <p className="text-gray-300 font-open-sans">
            ✔ Enhances remote coding collaboration for teams and interviewers.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12 text-center border-t border-gray-700 pt-6">
          <p className="text-lg font-semibold text-cyan-400 font-Chakra">
            Thank You!
          </p>
          <p className="text-gray-300 font-open-sans">
            Thank you for using SynCodex! We appreciate your trust in our
            platform for real-time coding collaboration and technical
            interviews. Keep coding, keep innovating, and let’s build the future
            together. Happy coding!
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AboutPage;
