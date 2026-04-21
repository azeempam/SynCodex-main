import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../services/api";
import useMeta from "../hooks/useMeta";

const ResetPassword = () => {
  useMeta();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Show/hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extract the reset token from the URL
  const token = searchParams.get("token");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await API.post("/api/auth/reset-password", {
        token,
        password,
      });

      if (res.status === 200) {
        toast.success("Password reset successful! Redirecting...");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#21232f]">
      <div className="bg-[#3D415A] py-10 w-[50%] text-center rounded-2xl border-2 border-blue-500">
        <h2 className="text-4xl font-Chakra text-white font-semibold my-10">
          Reset Password
        </h2>
        <form
          onSubmit={handleResetPassword}
          className="flex flex-col justify-center items-center"
        >
          {/* New Password Field */}
          <label htmlFor="password" className="flex justify-start w-[70%] m-auto text-gray-300 text-sm mb-1">
            New Password
          </label>
          <div className="relative w-[70%]">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 w-full p-5 rounded-lg text-white font-bold border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-[#21232f]"
              required
            />
            <button
              title="Toggle Password Visibility"
              name="Toggle Password Visibility"
              aria-label="Toggle Password Visibility"
              type="button"
              className="absolute right-4 top-5 p-1 text-gray-400 cursor-pointer text-lg"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Confirm Password Field */}
          <label htmlFor="confirmPassword" className="flex justify-start w-[70%] m-auto text-gray-300 text-sm mb-1">
            Confirm Password
          </label>
          <div className="relative w-[70%]">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-gray-700 w-full p-5 rounded-lg border-2 text-white font-bold border-transparent focus:outline-none focus:ring-2 focus:ring-[#21232f]"
              required
            />
            <button
              title="Toggle Password Visibility"
              name="Toggle Password Visibility"
              aria-label="Toggle Password Visibility"
              type="button"
              className="absolute right-4 top-5 p-1 text-gray-400 cursor-pointer text-lg"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            className="w-[70%] text-white font-bold rounded-lg bg-gradient-to-r from-[#94FFF2] to-[#506DFF] py-4 hover:opacity-90 cursor-pointer mt-3 text-lg"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
