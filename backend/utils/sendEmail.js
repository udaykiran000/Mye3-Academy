import nodemailer from "nodemailer";

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Render
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MYE 3 ACADEMY" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    return false;
  }
};

export default sendEmail;
