import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateNotificationPreferences,
  saveBrowserSubscription,
  googleAuthLogin,
  googleAuthCallback,
  disconnectGoogle,
  sendOtp,
  verifyOtpAndLogin,
  deleteAccount,
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// PUBLIC ROUTES (NO JWT REQUIRED)

router.route("/refresh-token").post(refreshAccessToken);

// REGISTRATION & OTP LOGIN FLOW
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify-otp").post(verifyOtpAndLogin);

// GOOGLE OAUTH ROUTES (Must also be unprotected)
router.route("/google/login").get(googleAuthLogin);
router.route("/google/callback").get(googleAuthCallback);

//  SECURED ROUTES (JWT REQUIRED)
router.use(verifyJWT);

router.route("/logout").post(logoutUser);
router.route("/current-user").get(getCurrentUser);
router.route("/update-details").patch(updateAccountDetails);

//  UPDATE NOTIFICATIONS
router.route("/notifications").patch(updateNotificationPreferences);

// BROWSER SUBSCRIPTION
// This handles saving and deleting the push subscription object.
router.route("/subscribe").post(saveBrowserSubscription); //

router.route("/google/disconnect").delete(disconnectGoogle);

//  DELETE ACCOUNT
router.route("/delete-account").delete(deleteAccount);

export default router;
