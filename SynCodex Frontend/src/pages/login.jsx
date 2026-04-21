import { Link, useNavigate } from "react-router-dom";
import lockIcon from "../assets/password_11817746 1.svg";
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

const Login = () => {
  useMeta();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [Gloading, GsetLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/api/auth/login", formData);

      console.log("User logged in:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token); // Store token
        localStorage.setItem("name", res.data.user.fullName);
        localStorage.setItem("email", res.data.user.email);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    GsetLoading(true);
    const user = await loginWithGoogle();
    if (user) {
      toast.success("Login successful!");
      navigate("/dashboard");
    } else {
      toast.error("Google login failed! Please try again.");
    }
    GsetLoading(false);
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
              <img src={lockIcon} alt="Secure Login" className="w-50 mb-4" />
              <h2 className="text-xl font-semibold">
                Welcome back to <span className="font-gradient">SynCodex</span>.
              </h2>
              <p className="text-gray-300 w-78">
                Code, collaborate, and conquer in real-time.
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="md:w-1/2 w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Login</h2>

              <form onSubmit={handleLogin}>
                <label htmlFor="email" className="block text-gray-300 text-sm mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  onChange={handleChange}
                  className={`w-full p-2 rounded-lg ${AppColors.inputFieldColor} text-white focus:outline-none focus:ring-2 focus:ring-[#21232f]`}
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
                    className={`w-full p-2 rounded-lg ${AppColors.inputFieldColor} text-white focus:outline-none focus:ring-2 focus:ring-[#21232f] pr-10`}
                    required
                  />

                  <button
                    type="button"
                    name="Toggle password visibility"
                    title="Toggle password visibility"
                    className="absolute right-3 top-2 text-gray-400 p-1 hover:text-white transition cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 mb-2 bg-gradient-to-r from-[#94FFF2] to-[#506DFF] text-white py-2 rounded-lg hover:opacity-90 cursor-pointer font-bold flex items-center justify-center gap-2 relative"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 my-0.5 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Login"
                  )}
                </button>

                <p>
                  <Link to="/forgot-password" className="text-xs text-[#BEDFF9]">
                    Forgot Password?
                  </Link>
                </p>
                <hr className="mt-3 border-gray-500" />
              </form>

              <div className="bg-gradient-to-r from-[#94FFF2] to-[#506DFF] p-[1px] rounded-lg mt-3">
                <button
                  onClick={handleGoogleLogin}
                  className={`w-full ${AppColors.inputFieldColor} py-2 rounded-lg flex items-center justify-center hover:bg-gray-600 cursor-pointer`}
                  disabled={loading}
                >
                  {Gloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="font-bold flex items-center gap-2.5">
                      <FcGoogle size={28} />
                      Login with Google
                    </span>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Don't have an account?{" "}
                <Link to="/signup" className="font-gradient">
                  Sign Up
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

export default Login;
