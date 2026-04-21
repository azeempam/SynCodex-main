import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import Scroll from "../components/scroll";
import { Link } from "react-router-dom";
import useMeta from "../hooks/useMeta";

const FAQSection = () => {
  useMeta();

  const [openIndex, setOpenIndex] = useState(null);
  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is SynCodex ?",
      answer:
        "SynCodex is a real-time collaborative code editor with live text streaming and integrated video calling, designed for coding interviews, pair programming, and remote coding collaboration.",
    },
    {
      question: "Who can use SynCodex ?",
      answer:
        "SynCodex is perfect for interviewers, developers, teams, students, and educators who need a seamless platform for live coding and communication.",
    },
    {
      question: "Does SynCodex work on mobile devices ?",
      answer:
        "SynCodex is optimized for desktop and laptop use, but we are working on improving mobile compatibility for a better experience.",
    },
    {
      question: "What technologies does SynCodex use ?",
      answer:
        "SynCodex is built with React.js, WebSocket, WebRTC, Python, JavaScript, MongoDB, and Firebase to provide a smooth and efficient real-time experience.",
    },
    {
      question: "Can I use SynCodex for coding interviews ?",
      answer:
        "Yes! SynCodex is designed for technical interviews, allowing interviewers to assess candidates with live coding and video calling in one platform.",
    },
    {
      question: "Does SynCodex support multiple programming languages ?",
      answer:
        "Yes! SynCodex supports multiple programming languages, allowing users to code in their preferred language during interviews or collaboration.",
    },
    {
      question: "How do I get started with SynCodex ?",
      answer:
        "Simply sign up, create a session, and start coding or interviewing in real time!",
    },
    {
      question: "Can multiple users collaborate at the same time ?",
      answer:
        "Yes! SynCodex supports multiple users coding together in real time, making it perfect for pair programming and team collaboration.",
    },
    {
      question: "How can I contact support ?",
      answer:
        "You can reach out to us via the Contact Us page for any inquiries, technical support, or feedback.",
    },
    {
      question:
        "What makes SynCodex different from other online code editors ?",
      answer:
        "Unlike traditional code editors, SynCodex combines real-time coding with video calling, making it a complete solution for coding interviews and collaboration.",
    },
  ];

  return (
    <>
      <Scroll />

      <Navbar />

      <section className="bg-[#21232f] sm:py-16 lg:py-24 text-white">
        <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-5xl">
          {/* Heading Section */}
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold font-Chakra leading-tight sm:text-4xl lg:text-5xl">
              Frequently Asked Questions (FAQ’s) – SynCodex
            </h2>
          </div>
          {/* FAQ List */}
          <div className="max-w-3xl mx-auto mt-8 space-y-4 md:mt-16">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-b from-[#94FFF2] to-[#506DFF] rounded-xl p-[2px]">
                <div
                  key={index}
                  className="transition-all duration-200 bg-[#3D415A] border-2 border-transparent rounded-[calc(10px-1px)] shadow-lg"
                >
                  {/* FAQ Question Button */}
                  <button
                    type="button"
                    className="flex items-center justify-between cursor-pointer w-full px-6 py-4 sm:p-6 text-lg font-semibold"
                    onClick={() => toggleAnswer(index)}
                  >
                    <span>{faq.question}</span>
                    {/* Expand/Collapse Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className={`w-6 h-6 text-gray-400 transform transition-transform ${
                        openIndex === index ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {/* FAQ Answer Section */}
                  {openIndex === index && (
                    <div className="px-6 pb-4 sm:px-6 sm:pb-6 text-gray-300">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Contact Support Section */}
          <p className="text-center text-gray-400 text-base mt-10">
            Still have questions?{" "}
            <Link
              to={"/contact"}
              className="cursor-pointer font-medium text-[#BEDFF9] transition-all duration-200 hover:opacity-80"
            >
              Contact our support
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default FAQSection;
