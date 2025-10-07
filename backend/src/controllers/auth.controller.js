import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { oauth2Client, SCOPES } from "../utils/googleAuth.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// REVISED: generateAccessAndRefreshTokens (backend/src/controllers/auth.controller.js)

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    // 1. Fetch the user
    const user = await User.findById(userId);
    console.log("User fetched (for token gen):", user ? "Found" : "Not Found"); // Debug log

    if (!user) {
      // 🎯 FIX: Do NOT throw a 500 error here.
      // If the user is not found, return null and let the calling function (refreshAccessToken)
      // handle the 401 Unauthorized security issue gracefully.
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
    console.error("Error in generateAccessAndRefreshTokens:", error); // Throwing a generic 500 here is acceptable if the database save fails.
    throw new ApiError(
      500,
      "Something went wrong during token generation (DB update failed)."
    );
  }
};

// Registering User

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, timezone } = req.body;

  if ([fullName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "Full name, email, and password are required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    fullName,
    email,
    password,
    timezone: timezone || "UTC",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    .status(201)
    .json({ user: createdUser, accessToken });
});

// Login User

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  const userSafe = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .cookie("refreshToken", refreshToken, options)
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: userSafe, token: accessToken },
        "Login successful"
      )
    );
});

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
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
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

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, email, timezone },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

// In backend/src/controllers/auth.controller.js

// REVISED: googleAuthLogin (Temporarily adapted for unauthenticated GET request)
// backend/src/controllers/auth.controller.js (Modification)

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

    // Success! Redirect the user back to the settings page
    res.redirect(FRONTEND_SETTINGS_URL + "?success=calendar_connected");
  } catch (error) {
    console.error("Error exchanging Google token:", error);
    // Redirect to settings with a generic error message
    res.redirect(FRONTEND_SETTINGS_URL + "?error=failed_connection");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  googleAuthCallback,
  googleAuthLogin,
};
