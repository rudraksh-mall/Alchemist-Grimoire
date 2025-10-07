import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
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

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
};
