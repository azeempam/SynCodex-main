import transporter from "../config/nodemailer.js";

const sendEmail = async ({ fullName, email, message }) => {
    try {
      const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Submission from ${fullName}`,
        text: `Name: ${fullName}\nEmail: ${email}\n\nMessage:\n${message}`,
      };
  
      await transporter.sendMail(mailOptions);
      return { success: true, message: "Email sent successfully!" };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: "Failed to send email" };
    }
};

export const contactUs = async (req, res) => {
    const { fullName, email, message } = req.body;
  
    if (!fullName || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
  
    const response = await sendEmail({ fullName, email, message });
  
    if (response.success) {
      return res.status(200).json({ message: response.message });
    } else {
      return res.status(500).json({ error: response.error });
    }
};