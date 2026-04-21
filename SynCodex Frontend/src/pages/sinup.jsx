import { Link, useNavigate } from "react-router-dom";
import SignupNow from "../assets/followers_6081941 1.svg";
import { useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { easeInOut, motion } from "motion/react";
import Scroll from "../components/scroll";
import { loginWithGoogle } from "../firebase";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import AppColors from "../utils/appColors";
import useMeta from "../hooks/useMeta";

const SignUP = () => {
  useMeta();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateEmail = (email) => emailRegex.test(email);
  const validatePassword = (password) => passwordRegex.test(password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error("Invalid Email!");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error(
        "Password must be at least 8 characters, with one uppercase, one number, and one special character!"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/api/auth/register", formData);
      console.log("User registered:", res.data);
      toast.success("User registered successfully! Please login.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error.response?.data || error);
      toast.error(error.response?.data.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const user = await loginWithGoogle();
    if (user) {
      toast.success("Google Signup Successful!");
      navigate("/dashboard");
    } else {
      toast.error("Google signup failed! Try again.");
    }
  };

  return (
    <>
      <Scroll />
      <Navbar hideStartCoding={true} />

      <div className="flex items-center justify-center p-10 bg-[#21232F] text-white">
        <motion.div
          initial={{ opacity: 0.4, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: easeInOut,
          }}
        >
          <div className="w-full max-w-3xl bg-[#3D415A] p-6 rounded-2xl border-3 border-blue-500 shadow-lg flex flex-col md:flex-row items-center animate-glow transition-all duration-500 hover:border-blue-400">
            <div className="flex flex-col items-center text-center md:w-1/2 p-6">
              <img src={SignupNow} alt="Secure Sign UP" className="w-50 mb-4" />
              <h2 className="text-xl font-semibold">
                Join <span className="font-gradient">SynCodex</span> now.
              </h2>
              <p className="text-gray-300 w-78">
                code smarter, collaborate faster, and innovate together
                seamlessly
              </p>
            </div>

            <div className="md:w-1/2 w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Sign UP</h2>
              <form onSubmit={handleSubmit}>
                <label htmlFor="fullName" className="block text-gray-300 text-sm mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${AppColors.inputFieldColor} text-white focus:outline-none`}
                  required
                />

                <label htmlFor="email" className="block text-gray-300 text-sm mt-3 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${AppColors.inputFieldColor} text-white focus:outline-none`}
                  required
                />

                <label htmlFor="password" className="block text-gray-300 text-sm mt-3 mb-1">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    onChange={handleChange}
                    className={`w-full p-2 rounded-lg ${AppColors.inputFieldColor} text-white focus:outline-none pr-10`}
                    required
                  />

                  <button
                    type="button"
                    name="Toggle password visibility"
                    title="Toggle password visibility"
                    className="absolute right-3 top-2 p-1 text-gray-400 hover:text-white transition cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-[#94FFF2] to-[#506DFF] text-white py-2 rounded-lg hover:opacity-90 cursor-pointer font-bold flex items-center justify-center gap-2 relative"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 my-0.5 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Register"
                  )}
                </button>

                <hr className="mt-3 border-gray-500" />
              </form>

              <div className="bg-gradient-to-r from-[#94FFF2] to-[#506DFF] p-[1px] rounded-lg mt-3">
                <button
                  onClick={handleGoogleLogin}
                  className={`w-full ${AppColors.inputFieldColor} py-2 rounded-lg flex items-center justify-center hover:bg-gray-600 cursor-pointer`}
                >
                  <span className="font-bold flex items-center gap-2.5">
                    <FcGoogle size={28} />
                    Sign Up with Google
                  </span>
                </button>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Already have an account?{" "}
                <Link to="/login" className="font-gradient ">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
};

export default SignUP;
