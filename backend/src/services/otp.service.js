// backend/services/otp.service.js (NEW FILE)

import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generates an OTP, saves the hashed version to the user record, and sets an expiration time.
 * @param {string} email - The user's email address.
 * @returns {string} The raw OTP to be sent via email.
 */
export const generateAndSaveOtp = async (email) => {
    // Generate a 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP before saving (Security Best Practice)
    const hashedOtp = crypto
        .createHash('sha256')
        .update(rawOtp)
        .digest('hex');

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

/**
 * Verifies the provided OTP against the hashed token in the database.
 */
export const verifyOtp = async (email, providedOtp) => {
    const user = await User.findOne({ email });

    if (!user || !user.emailVerificationToken) {
        return { success: false, message: "User not found or verification not initiated." };
    }
    
    // 1. Check for expiration
    if (user.emailVerificationExpires < Date.now()) {
        // Clear the expired token to prevent future attempts
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save({ validateBeforeSave: false });
        return { success: false, message: "OTP expired. Please request a new one." };
    }

    // 2. Hash the provided OTP for comparison
    const hashedProvidedOtp = crypto
        .createHash('sha256')
        .update(providedOtp)
        .digest('hex');

    // 3. Compare the hashes
    if (hashedProvidedOtp !== user.emailVerificationToken) {
        return { success: false, message: "Invalid OTP. Please try again." };
    }

    // 4. SUCCESS: Clear the token fields for security and return the user
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.isVerified = true; // Optionally set the isVerified flag
    await user.save({ validateBeforeSave: false });
    
    return { success: true, user };
};