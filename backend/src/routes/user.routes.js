import { Router } from "express";
import {
  registerUser,
  // loginUser is now the alias for sendOtp, so we can keep it
  loginUser, 
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  // --- NEW IMPORT FOR NOTIFICATION UPDATE ---
  updateNotificationPreferences, 
  // --- NEW IMPORT FOR SUBSCRIPTION ---
  saveBrowserSubscription, // <--- NEW IMPORT
  // ------------------------------------------
  googleAuthLogin,
  googleAuthCallback,
  disconnectGoogle,
  // --- NEW IMPORTS ---
  sendOtp,
  verifyOtpAndLogin, 
  // --- DELETE ACCOUNT IMPORT ---
  deleteAccount, 
  // -----------------------------
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES (NO JWT REQUIRED) ---

// TOKEN REFRESH: MUST be defined early and unprotected.
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

// === EXISTING SECURED ROUTE: UPDATE NOTIFICATIONS ===
router.route("/notifications").patch(updateNotificationPreferences); 

// === NEW SECURED ROUTE: BROWSER SUBSCRIPTION ===
// This handles saving and deleting the push subscription object.
router.route("/subscribe").post(saveBrowserSubscription); // <--- NEW ROUTE

router.route("/google/disconnect").delete(disconnectGoogle);

// === NEW SECURED ROUTE: DELETE ACCOUNT ===
router.route("/delete-account").delete(deleteAccount); 
// =========================================

export default router;