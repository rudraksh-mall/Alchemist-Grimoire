import { Router } from "express";
import {
  registerUser,
  // loginUser is now the alias for sendOtp, so we can keep it
  loginUser, 
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  googleAuthLogin,
  googleAuthCallback,
  disconnectGoogle,
  // --- NEW IMPORTS ---
  sendOtp,
  verifyOtpAndLogin, 
  // -------------------
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES (NO JWT REQUIRED) ---

// TOKEN REFRESH: MUST be defined early and unprotected. (Moved up)
router.route("/refresh-token").post(refreshAccessToken);

// REGISTRATION & OTP LOGIN FLOW
router.route("/register").post(registerUser);
router.route("/login").post(loginUser); 
router.route("/verify-otp").post(verifyOtpAndLogin);

// GOOGLE OAUTH ROUTES (Must also be unprotected)
router.route("/google/login").get(googleAuthLogin);
router.route("/google/callback").get(googleAuthCallback);

// --- SECURED ROUTES (JWT REQUIRED) ---
router.use(verifyJWT); // <--- MIDDLEWARE STARTS HERE!

router.route("/logout").post(logoutUser);
router.route("/current-user").get(getCurrentUser);
router.route("/update-details").patch(updateAccountDetails);
router.route("/google/disconnect").delete(disconnectGoogle);

export default router;