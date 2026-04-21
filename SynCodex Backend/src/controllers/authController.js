import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";
import dotenv from "dotenv";
import User from "../models/User.js";
import crypto from "crypto";

dotenv.config();

// Generate JWT Token
export const generateToken = (user) => {
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
};

// User Registration Function
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    await sendWelcomeEmail(email, fullName);

    res.status(201).json({
      message: "User registered successfully! Please login.",
      user: { fullName, email: newUser.email },
    });

  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Function to Send Welcome Email
const sendWelcomeEmail = async (email, fullName) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to SynCodex!",
      html: `
        <h2>Welcome, ${fullName}!</h2>
        <p>Thank you for joining SynCodex! We're excited to have you on board.</p>
        <p>Start exploring and coding now.</p>
        <p>Happy Coding! 🚀</p>
      `,
    });

    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email Sending Error:", error.message);
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = generateToken(user);
    console.log(token);

    res.json({
      message: "Login successful",
      user: { fullName: user.fullName, email: user.email },
      token,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Refresh Token
export const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Unauthorized - No Refresh Token" });

  try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "default_refresh_secret");
      const newToken = generateToken({ email: decoded.email });
      res.cookie("token", newToken, { httpOnly: true, secure: true, sameSite: "Strict", maxAge: 3600000 });
      res.json({ accessToken: newToken });
  } catch (err) {
      return res.status(403).json({ message: "Invalid Refresh Token" });
  }
};

//forgot password function
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    await sendResetEmail(email, resetToken);

    return res.status(200).json({ message: "Reset email sent successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//reset password email send function
const sendResetEmail = async (email, resetToken) => {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click the link below:</p>
           <a target="_blank" href="${resetLink}">${resetLink}</a>
           <p>This link will expire in 1 hour.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

//reset password function
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//google login function
export const googleLogin = async (req, res) => {
  try {
      const { email, name, googleId } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      let user = await User.findOne({ email: email.toLowerCase() });

      let isFirstLogin = false;

      if (!user) {
          isFirstLogin = true;
          const hashedGoogleId = await bcrypt.hash(googleId, 10);
          user = new User({
              fullName: name,
              email: email.toLowerCase(),
              password: hashedGoogleId,
          });
          await user.save();
      }

      const token = generateToken(user);

      if (isFirstLogin) {
          await sendWelcomeEmail(email, name);
      }

      res.json({
        message: "Login successful",
        user: { fullName: user.fullName, email: user.email },
        token,
      });

  } catch (error) {
    console.error("🔥 Google Login Error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};