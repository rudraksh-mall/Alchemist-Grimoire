import { mailTransporter } from "../db/mailer.js";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await mailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log(`📩 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
  }
};
