import bcrypt from "bcryptjs";
import User from "../models/User.js";
import transporter from "../config/nodemailer.js";

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userEmail = req.user.email;

  try {
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Your SynCodex Password Was Changed",
      html: `
        <h2>Password Change Alert</h2>
        <p>Hey ${user.fullName || "User"},</p>
        <p>Your SynCodex password was successfully changed.</p>
        <p>If this wasn’t you, please reset your password or contact support immediately.</p>
        <br/>
        <p>– The SynCodex Team</p>
      `
    });

    res.status(200).json({ message: "Password updated successfully and email sent." });
  } catch (err) {
    console.error("Password change error:", err.message);
    res.status(500).json({ error: "Failed to change password" });
  }
};

export const changeName = async (req, res) => {
  const { fullName } = req.body;
  const email = req.user.email;

  if (!fullName || fullName.trim() === "") {
    return res.status(400).json({ error: "Full name is required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.fullName = fullName;
    await user.save();

    res.status(200).json({ message: "Name updated successfully", fullName });
  } catch (err) {
    console.error("Error updating name:", err.message);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};

export const changeEmail = async (req, res) => {
  const { password, newEmail } = req.body;
  const currentEmail = req.user.email;

  if (!password || !newEmail) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const user = await User.findOne({ email: currentEmail.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use." });
    }

    user.email = newEmail.toLowerCase();
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: currentEmail,
      subject: "SynCodex Email Removed",
      html: `<p>Your email <strong>${currentEmail}</strong> has been removed from your account. If this wasn't you, contact support immediately.</p>`
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newEmail,
      subject: "SynCodex Email Added",
      html: `<p>Welcome! Your email <strong>${newEmail}</strong> is now associated with your SynCodex account.</p>`
    });

    res.status(200).json({ message: "Email updated successfully", newEmail });

  } catch (err) {
    console.error("Email change error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const email = req.user.email;

  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    await User.deleteOne({ _id: user._id });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your SynCodex Account Was Deleted",
      html: `
        <h3>We're sorry to see you go.</h3>
        <p>Your SynCodex account has been successfully deleted.</p>
        <p>If this wasn’t you, please contact our support team immediately.</p>
      `
    });

    res.status(200).json({ message: "Account deleted and email sent." });

  } catch (err) {
    console.error("Account deletion error:", err.message);
    res.status(500).json({ error: "Failed to delete account." });
  }
};