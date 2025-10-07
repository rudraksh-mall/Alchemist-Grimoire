import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  googleAuthLogin,
  googleAuthCallback,
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// --- GOOGLE OAUTH ROUTES ---
// 1. Initiates OAuth flow (requires JWT to know WHO is connecting)
router.route("/google/login").get(googleAuthLogin);

// 2. Receives callback from Google (does NOT require JWT)
router.route("/google/callback").get(googleAuthCallback);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

export default router;
