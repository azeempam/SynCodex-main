import { useState } from "react";
import ContactImage from "../assets/Contact-Us.svg";
import Navbar from "../components/Navbar";
import Scroll from "../components/scroll";
import Footer from "../components/footer";
import { toast } from "react-toastify";
import API from "../services/api";
import AppColors from "../utils/appColors";
import useMeta from "../hooks/useMeta";

const ContactUs = () => {
  useMeta();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // New state for loading

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true); // Start loading

    try {
      const response = await API.post("/api/contact", formData, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Message sent successfully!");
      setFormData({ fullName: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.error || "Failed to send message.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <>
      <Scroll />
      <Navbar />
      <div className="flex justify-center items-center p-10 bg-[#21232f]">
        <div className="bg-[#3d415a] p-10 rounded-2xl shadow-lg w-[600px] text-white border-3 border-blue-400 flex flex-col items-center">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Contact Us
          </h2>
          <div className="w-full flex flex-col items-center">
            <img src={ContactImage} alt="Contact Us" className="w-32 mb-6" />
            <div className="w-full text-center">
              <p className="text-lg font-semibold text-gray-300">
                Let's Connect & Code!
              </p>
              <p className="text-gray-300 mb-6">
                Got questions or need support? We're here to help! Reach out for
                inquiries, feedback, or assistance.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg ${AppColors.inputFieldColor} focus:outline-none`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm">{errors.fullName}</p>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg ${AppColors.inputFieldColor} focus:outline-none`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}

            <textarea
              name="message"
              placeholder="Message"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className={`w-full p-3 rounded-lg ${AppColors.inputFieldColor} focus:outline-none`}
            ></textarea>
            {errors.message && (
              <p className="text-red-500 text-sm">{errors.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 cursor-pointer rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 hover:opacity-90 transition duration-300"
            >
              {loading ? "Sending..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactUs;
