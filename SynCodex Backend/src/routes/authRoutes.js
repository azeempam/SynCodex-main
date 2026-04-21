import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword, refreshToken, googleLogin} from "../controllers/authController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

//Route for verifing users with Email & Password
router.get("/protected", verifyToken, (req, res) => {
    res.json({ message: "Access Granted", user: req.user });
});

//Route fo verifing users with google
router.post("/google",googleLogin);

// Route for user registration
router.post("/register", registerUser);

// Route for user login
router.post("/login", loginUser);

//Route for forgot password
router.post("/forgot-password", forgotPassword);

//Route for reset password 
router.post("/reset-password", resetPassword);

//Route for refresh token
router.post("/refresh", refreshToken);

export default router;