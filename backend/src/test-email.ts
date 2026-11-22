import dotenv from "dotenv";
import transporter from "./config/mail.js";

dotenv.config();

async function testEmail() {
  try {
    console.log("Checking SMTP connection...");

    await transporter.verify();

    console.log("SMTP connection successful!");

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: "SecureAuth SMTP Test",
      text: "Your SMTP configuration is working successfully."
    });

    console.log("Email sent:", result.messageId);

  } catch (error) {
    console.error("SMTP test failed:", error);
  } finally {
    transporter.close();
  }
}

testEmail();