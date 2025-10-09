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
  disconnectGoogle,
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

// --- SECURED ROUTES ---
// 🎯 FIX: Apply middleware globally to subsequent routes
router.use(verifyJWT);

router.route("/logout").post(logoutUser);
router.route("/current-user").get(getCurrentUser);
router.route("/update-details").patch(updateAccountDetails);

// 🎯 FIX: Ensure the disconnect route is placed AFTER router.use(verifyJWT)
// or is protected by the middleware inline.
router.route("/google/disconnect").delete(disconnectGoogle);

export default router;
