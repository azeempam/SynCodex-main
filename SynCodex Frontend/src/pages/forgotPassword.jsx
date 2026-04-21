import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import API from "../services/api";
import AppColors from "../utils/appColors";
import useMeta from "../hooks/useMeta";

const ForgotPassword = () => {
  useMeta();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/api/auth/forgot-password", { email });

      if (res.status === 200) {
        toast.success("Reset email sent! Check your inbox.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center p-10 h-screen bg-[#21232f]">
      <div className="bg-[#3D415A] p-10 w-[400px] text-center rounded-2xl border-2 border-blue-500">
        <h2 className="text-3xl font-Chakra text-white font-semibold mb-5">
          Forgot Password
        </h2>
        <form
          onSubmit={handleForgotPassword}
          className="flex flex-col justify-center items-center"
        >
          <label htmlFor="email" className="flex w-full text-gray-300 text-sm mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${AppColors.inputFieldColor} w-full py-2 px-3 rounded-lg text-white focus:outline-none`}
            required
          />
          <button
            type="submit"
            className="w-full text-white font-bold rounded-lg bg-gradient-to-r from-[#94FFF2] to-[#506DFF] p-2 hover:opacity-90 cursor-pointer mt-4 gap-2 items-center justify-center relative"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
        <p className="justify-self-start pt-4 text-[#BEDFF9] text-xs">
          <Link to={"/login"}>Go Back to login page</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
