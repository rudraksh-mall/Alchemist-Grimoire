import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { oauth2Client, SCOPES } from "../utils/googleAuth.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// --- NEW IMPORTS for OTP FLOW ---
import { generateAndSaveOtp, verifyOtp } from '../services/otp.service.js';
import { sendEmail } from '../services/email.service.js'; 
// ----------------------------------


// Function to safely return a user object without sensitive fields
const getSafeUser = async (userId) => {
    // NOTE: This now excludes the new OTP fields (emailVerificationToken, emailVerificationExpires)
    return await User.findById(userId).select("-password -refreshToken -emailVerificationToken -emailVerificationExpires");
}

// REVISED: generateAccessAndRefreshTokens (backend/src/controllers/auth.controller.js)

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // 1. Fetch the user
    const user = await User.findById(userId);
    console.log("User fetched (for token gen):", user ? "Found" : "Not Found"); // Debug log

    if (!user) {
      // If the user is not found, return null and let the calling function handle the 401.
      return { accessToken: null, refreshToken: null };
    }

    // 2. Generate new tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 3. Save the new refresh token to the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateAccessAndRefreshTokens:", error);
    throw new ApiError(
      500,
      "Something went wrong during token generation (DB update failed)."
    );
  }
};

// Registering User (MODIFIED FOR OTP FLOW)

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, timezone } = req.body;

  if ([fullName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "Full name, email, and password are required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) throw new ApiError(409, "Email already registered");

  // 1. Create the user (defaults to isVerified: false)
  const user = await User.create({
    fullName,
    email,
    password,
    timezone: timezone || "UTC",
    isVerified: false, 
  });
  
  // 2. Generate and save the OTP (this also updates the token fields on the user document)
  const rawOtp = await generateAndSaveOtp(email);

  // 3. Send the email (Circus Crier)
  await sendEmail({
      to: email,
      subject: "🎪 Alchemist's Grimoire: Your Registration Code",
      html: `
          <div style="font-family: Arial, sans-serif; text-align: center;">
              <h2 style="color: #4c1d95;">Welcome to the Grimoire!</h2>
              <p>Your one-time verification code to complete your registration is:</p>
              <div style="background-color: #e0e7ff; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; margin: 20px auto; width: fit-content; color: #4c1d95;">
                  ${rawOtp}
              </div>
              <p style="color: #777;">This code expires in 5 minutes. Use it quickly to enter the Arena!</p>
          </div>
      `
  });
  
  // 4. Return success response. DO NOT generate tokens here.
  return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            { email: user.email }, 
            "User created. Verification code sent successfully."
        )
    );
});

// --- NEW FUNCTION: Send OTP (Replaces the first step of traditional login) ---
const sendOtp = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // 1. Validate the password first (Security Step)
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials.");
    }

    // 2. Generate and save the OTP
    const rawOtp = await generateAndSaveOtp(email);

    // 3. Send the email (Circus Crier)
    await sendEmail({
        to: email,
        subject: "🎪 Alchemist's Grimoire: Your Login OTP Code",
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2 style="color: #4c1d95;">The Mystic Fortune Teller calls!</h2>
                <p>Your one-time login code to access the Grand Grimoire is:</p>
                <div style="background-color: #e0e7ff; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; margin: 20px auto; width: fit-content; color: #4c1d95;">
                    ${rawOtp}
                </div>
                <p style="color: #777;">This code expires in 5 minutes. Do not share this vital information.</p>
            </div>
        `
    });

    return res.status(200).json(
        new ApiResponse(
            200, 
            { email: user.email }, 
            "Password validated. OTP sent successfully."
        )
    );
});

// --- NEW FUNCTION: Verify OTP and Complete Login ---
const verifyOtpAndLogin = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and One-Time Password (OTP) are required.");
    }

    // 1. Verify the OTP using the service (This also clears the token and sets isVerified=true)
    const verificationResult = await verifyOtp(email, otp);

    if (!verificationResult.success) {
        throw new ApiError(401, verificationResult.message);
    }
    
    const user = verificationResult.user;

    // 2. Generate new tokens for login
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };
    
    const userSafe = await getSafeUser(user._id);

    // 3. Complete Login
    return res
        .cookie("refreshToken", refreshToken, options)
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: userSafe, accessToken },
                "OTP verified. Login successful."
            )
        );
});

// REMOVED: The old 'loginUser' is functionally replaced by sendOtp and verifyOtpAndLogin.
// If you want to keep the old route name but use the new logic:
const loginUser = sendOtp; // Alias loginUser to the first step of the new flow.


// Logout User

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  res
    .clearCookie("refreshToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// GET CURRENT USER

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await getSafeUser(req.user._id);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched"));
});

// REFRESH ACCESS TOKEN

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await User.findById(decodedToken._id);

  // 🎯 FIX: Combined check to prevent access to user.refreshToken if user is null 🎯
  if (!user || incomingRefreshToken !== user.refreshToken) {
    // If user is null (not found) OR tokens don't match (revoked)
    throw new ApiError(401, "Refresh token invalid or expired");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .cookie("refreshToken", newRefreshToken, options)
    .status(200)
    .json(
      new ApiResponse(200, { token: accessToken }, "Access token refreshed")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, timezone } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All fields are required");

  // Perform update
  await User.findByIdAndUpdate(
    req.user._id,
    { fullName, email, timezone }
  );
  
  // Return updated safe user object
  const updatedUser = await getSafeUser(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});


const googleAuthLogin = (req, res) => {
  // 🎯 FIX: Get userId from query param (sent by the frontend) instead of req.user._id
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send("User ID is required to initiate OAuth.");
  }

  // Generate the URL, passing the userId via the state parameter
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    state: userId, // The state parameter securely carries the ID to the callback
    // 🎯 CRITICAL FIX: Ensure prompt is included to force re-consent and issue a refresh token
    prompt: "consent",
  });

  res.redirect(authUrl);
};

// NEW FUNCTION: Google Callback (Handles token exchange)
// Mapped to: GET /api/v1/auth/google/callback
// ----------------------------------------------------------------------
const googleAuthCallback = asyncHandler(async (req, res) => {
  const { code, state: userId } = req.query; // Get the auth code and the user ID we sent earlier

  // 🎯 NOTE: Assuming your frontend is running on localhost:5173
  const FRONTEND_SETTINGS_URL = process.env.CORS_ORIGIN + "/settings";

  if (!code || !userId) {
    // 🎯 FIX: Use the correct error parameter name
    return res.redirect(FRONTEND_SETTINGS_URL + "?error=auth_failed");
  }

  try {
    // 1. Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // 2. Check for the Refresh Token (Indicates successful grant of offline access)
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      // If no refresh token, the user needs to reconnect or manually grant access
      return res.redirect(FRONTEND_SETTINGS_URL + "?error=no_refresh_token");
    }

    // 3. Save the refresh token to the User model
    // We only save the long-lived refresh token; the short-lived access token will be handled by googleapis.
    await User.findByIdAndUpdate(
      userId,
      {
        googleRefreshToken: refreshToken,
      },
      { new: true }
    );

    // 🎯 FIX: Use the correct success parameter name expected by the frontend (calendar_sync=success)
    res.redirect(FRONTEND_SETTINGS_URL + "?calendar_sync=success");
  } catch (error) {
    console.error("Error exchanging Google token:", error);
    // Redirect to settings with a generic error message
    res.redirect(FRONTEND_SETTINGS_URL + "?error=failed_connection");
  }
});

// 🎯 NEW FUNCTION: Disconnect Google Calendar
// Mapped to: DELETE /api/v1/users/google/disconnect
const disconnectGoogle = asyncHandler(async (req, res) => {
    // 1. Clear the token field using $unset
    await User.findByIdAndUpdate(
        req.user._id, 
        { $unset: { googleRefreshToken: 1 } }
    );
    
    // 2. Retrieve the newly updated safe user object
    const updatedUser = await getSafeUser(req.user._id);

    if (!updatedUser) {
        throw new ApiError(404, "User not found after disconnect");
    }

    // 3. Send back the updated user object (with googleRefreshToken now missing)
    return res.status(200).json(new ApiResponse(200, updatedUser, "Google Calendar disconnected"));
});


export {
  registerUser,
  loginUser, // Note: This now maps to the first step of the OTP flow (sendOtp)
  sendOtp, // Explicit export if you want a separate route name
  verifyOtpAndLogin, // The final login step
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  googleAuthCallback,
  googleAuthLogin,
  disconnectGoogle, 
};