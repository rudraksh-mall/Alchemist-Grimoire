import { mailTransporter } from "../db/mailer.js";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_USER, // Sender email defined in .env
      to,
      subject,
      text,
      html,
    });
    // Logs the successful transmission and the unique Message ID for debugging
    console.log(`📩 Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Email send failed for ${to}:`, error.message);
    return false; // Return false on failure
  }
};
