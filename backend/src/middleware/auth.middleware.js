import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Middleware to verify JWT and attach user to request
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Only use Authorization header now
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer "))
      throw new ApiError(401, "No access token provided");

    const token = authHeader.replace("Bearer ", "");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
