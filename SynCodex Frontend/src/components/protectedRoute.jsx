import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api"; // Ensure this is configured to send credentials

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [toastShown, setToastShown] = useState(false); // Track toast display
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {

      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        if (!toastShown) {
          toast.error("You are not authenticated. Please login to continue.");
          setToastShown(true);
        } 
        return;
      }

      try {
          const res = await API.get("/api/auth/protected", {
          headers: { Authorization: `Bearer ${token}` },
        }); // Backend route to verify authentication

        setIsAuthenticated(res.data ? true : false);
      } catch (error) {
        setIsAuthenticated(false);
        toast.error("Session expired! Please login again.");
      }
    };

    checkAuth();
  }, [toastShown]); // Dependency array ensures the toast isn't fired twice

  if (isAuthenticated === null) return <div>Loading...</div>; // Show a loader while checking auth

  return isAuthenticated ?( children ): (
      <Navigate to="/login" state={{ from: location }} replace />
);
};

export default ProtectedRoute;
