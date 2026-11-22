import transporter from "../config/mail.js";

export async function sendOTPEmail(
  email: string,
  otp: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your SecureAuth verification code",

    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>SecureAuth Verification</h2>
        <p>Your verification code is:</p>

        <h1 style="letter-spacing:8px">
          ${otp}
        </h1>

        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this code, ignore this email.</p>
      </div>
    `
  });
}