import crypto from "crypto";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const generateAndSaveOtp = async (email) => {
  // Generate a 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the OTP before saving (Security Best Practice)
  const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");

  // Set expiration time (e.g., 5 minutes)
  // NOTE: Using 300,000 milliseconds for 5 minutes
  const otpExpires = Date.now() + 5 * 60 * 1000;

  // Update the user record with the new token and expiration
  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      emailVerificationToken: hashedOtp,
      emailVerificationExpires: otpExpires,
    },
    { new: true } // Return the updated document
  );

  if (!updatedUser) {
    throw new ApiError(500, "Failed to save OTP to user record.");
  }

  return rawOtp;
};

export const verifyOtp = async (email, providedOtp) => {
  const user = await User.findOne({ email });

  if (!user || !user.emailVerificationToken) {
    return {
      success: false,
      message: "User not found or verification not initiated.",
    };
  }

  // Check for expiration
  if (user.emailVerificationExpires < Date.now()) {
    // Clear the expired token to prevent future attempts
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save({ validateBeforeSave: false });
    return {
      success: false,
      message: "OTP expired. Please request a new one.",
    };
  }

  //  Hash the provided OTP for comparison
  const hashedProvidedOtp = crypto
    .createHash("sha256")
    .update(providedOtp)
    .digest("hex");

  //  Compare the hashes
  if (hashedProvidedOtp !== user.emailVerificationToken) {
    return { success: false, message: "Invalid OTP. Please try again." };
  }

  //  SUCCESS: Clear the token fields for security and return the user
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  user.isVerified = true; // Optionally set the isVerified flag
  await user.save({ validateBeforeSave: false });

  return { success: true, user };
};
