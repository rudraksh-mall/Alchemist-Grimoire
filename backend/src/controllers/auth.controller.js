import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
// --- NEW IMPORT FOR CASCADING DELETION ---
import { DoseLog } from "../models/doseLog.model.js";
import { MedicationSchedule } from "../models/medicationSchedule.model.js";
// ------------------------------------------
import { oauth2Client, SCOPES } from "../utils/googleAuth.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// --- NEW IMPORTS for OTP FLOW ---
import { generateAndSaveOtp, verifyOtp } from "../services/otp.service.js";
import { sendEmail } from "../services/email.service.js";
// ----------------------------------

// --- Helper Function: Defines Robust Cookie Options (Used in multiple places) ---
const getCookieOptions = () => {
  if (process.env.NODE_ENV === "production") {
    // Production settings (requires HTTPS)
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };
  } else {
    // Development settings (HTTP localhost)
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    };
  }
};
// -----------------------------------------------------------------------------

// Function to safely return a user object without sensitive fields
const getSafeUser = async (userId) => {
  // NOTE: We exclude the sensitive browserSubscription fields here for security
  return await User.findById(userId).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpires -browserSubscription"
  );
};

// REVISED: generateAccessAndRefreshTokens (Handles token creation and saving)

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
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

// Registering User (MODIFIED FOR OTP FLOW - Step 1: Create User & Send OTP)

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

  // 2. Generate and save the OTP
  const rawOtp = await generateAndSaveOtp(email);

  // 3. Send the email
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
      `,
  });

  // 4. Return success response. (Frontend moves to verification step)
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

// --- NEW FUNCTION: Send OTP (Login Step 1: Check Password & Send Code) ---
const sendOtp = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // 1. Validate the password first
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
        `,
  });

  return res
    .status(200)
    .json(
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

  // 1. Verify the OTP using the service
  const verificationResult = await verifyOtp(email, otp);

  if (!verificationResult.success) {
    throw new ApiError(401, verificationResult.message);
  }

  const user = verificationResult.user;

  // 2. Generate new tokens for login
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // CRITICAL FIX: Use the robust options getter
  const options = getCookieOptions();

  // DEBUG LOG 1: Log the cookie options being set during successful login/verification
  console.log(
    `[DEBUG-AUTH] Setting Refresh Token Cookie with options:`,
    options
  );

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
const loginUser = sendOtp; // Alias loginUser to the first step of the new flow.

// Logout User

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  // CRITICAL FIX: Ensure clearCookie uses the same options set during cookie creation
  const options = getCookieOptions();

  res
    .clearCookie("refreshToken", options) // <-- Must include same options for clearing
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
  // DEBUG LOG 2: Check the raw incoming cookie header
  console.log(`\n--- REFRESH ATTEMPT ---`);
  console.log(`[DEBUG-REFRESH-1] Incoming Request URL: ${req.originalUrl}`);

  // Check req.headers.cookie for raw string (more reliable than Express's req.cookies)
  // We cannot console.log req.headers.cookie due to security, but req.cookies is what Express parses.
  console.log(`[DEBUG-REFRESH-2] Parsed Cookies (Express):`, req.cookies);

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // DEBUG LOG 3: Check if the token was successfully extracted
  if (!incomingRefreshToken) {
    console.error(
      `[DEBUG-REFRESH-FAIL] Token Missing! Browser did not send the cookie.`
    );
    throw new ApiError(401, "Unauthorized request: Refresh token missing.");
  }

  // DEBUG LOG 4: Log if JWT verification fails (Token is expired/malformed)
  console.log(
    `[DEBUG-REFRESH] Refresh Token Extracted. Attempting verification...`
  );

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (err) {
    console.error(`[DEBUG-REFRESH-FAIL] JWT Verification Failed:`, err.message);
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodedToken._id);

  // 🎯 FIX: Combined check to prevent access to user.refreshToken if user is null 🎯
  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token invalid or expired");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  // CRITICAL FIX: Use the robust options getter
  const options = getCookieOptions();

  // DEBUG LOG 5: Log the new cookie options before sending a new one.
  console.log(`[DEBUG-REFRESH-SUCCESS] Renewed RT. New Options:`, options);

  return res
    .cookie("refreshToken", newRefreshToken, options)
    .status(200)
    .json(
      new ApiResponse(200, { token: accessToken }, "Access token refreshed")
    );
});

// === NEW FEATURE: TOGGLE NOTIFICATIONS CONTROLLER ===
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // We expect the body to contain the new settings object
  const { browserNotifications, emailNotifications } = req.body;

  // 1. Input Validation
  if (browserNotifications === undefined || emailNotifications === undefined) {
    throw new ApiError(
      400,
      "Missing notification fields (browserNotifications, emailNotifications)."
    );
  }

  // 2. Update the nested document field using the $set operator
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "notificationPreferences.browser": browserNotifications,
        "notificationPreferences.email": emailNotifications,
      },
    },
    // IMPORTANT: Return the new document
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found for update.");
  }

  // 3. Return the updated safe user object so the frontend store can refresh its state
  // NOTE: This sends the current, updated user object back to the client.
  const userSafe = await getSafeUser(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, userSafe, "Notification preferences updated."));
});
// ====================================================

// === NEW FEATURE: BROWSER SUBSCRIPTION CONTROLLER ===
const saveBrowserSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // The request body should contain the PushSubscription object from the frontend
  const subscription = req.body.subscription;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    // If the subscription is null or missing required fields, treat it as an unsubscribe request.

    // 1. Update the User document to clear the subscription field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { browserSubscription: null },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found.");
    }

    const userSafe = await getSafeUser(userId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, userSafe, "Browser unsubscribed successfully.")
      );
  }

  // 2. If the subscription is valid, update the User document to save it.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        browserSubscription: subscription,
        // Ensure the notification preference is ON if they just subscribed
        "notificationPreferences.browser": true,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found for subscription.");
  }

  const userSafe = await getSafeUser(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, userSafe, "Browser subscribed successfully."));
});
// ====================================================

// === NEW FEATURE: DELETE ACCOUNT CONTROLLER ===
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id; // User ID attached by verifyJWT middleware

  // 1. Delete all associated Dose Logs
  await DoseLog.deleteMany({ userId });

  // 2. Delete all Medication Schedules
  await MedicationSchedule.deleteMany({ userId });

  // 3. Delete the User record itself
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    // This should not happen if the user was authenticated, but is a safe guard
    throw new ApiError(404, "User account not found for deletion.");
  }

  // 4. Clear the cookies/session (Frontend store handles logout/redirection)
  const options = getCookieOptions();
  res.clearCookie("refreshToken", options);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Account deleted successfully."));
});
// ==============================================

// CRITICAL FIX: Implement updateAccountDetails to save the new Reminder Timing field
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, timezone } = req.body;
  // CRITICAL: Extract the new field from the request body
  const { reminderTimingMinutes } = req.body;

  if (!fullName || !email) throw new ApiError(400, "All fields are required");

  // Build the update object dynamically
  const updateObject = {
    fullName,
    email,
    timezone,
  };

  // Conditionally add the reminder timing only if it exists in the request body
  // Note: We check if it is explicitly in the body, which it will be from the frontend Save function.
  if (reminderTimingMinutes !== undefined) {
    updateObject.reminderTimingMinutes = reminderTimingMinutes;
  }

  // Perform update
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updateObject, // Use the dynamically created object
    { new: true, runValidators: true } // Ensure validation runs for the new Number field
  );

  // Return updated safe user object
  const userSafe = await getSafeUser(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, userSafe, "Profile updated successfully"));
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
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { googleRefreshToken: 1 },
  });

  // 2. Retrieve the newly updated safe user object
  const updatedUser = await getSafeUser(req.user._id);

  if (!updatedUser) {
    throw new ApiError(404, "User not found after disconnect");
  }

  // 3. Send back the updated user object (with googleRefreshToken now missing)
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Google Calendar disconnected"));
});

export {
  registerUser,
  loginUser, // Note: This now maps to the first step of the OTP flow (sendOtp)
  sendOtp, // Explicit export if you want a separate route name
  verifyOtpAndLogin, // The final login step
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails, // <-- UPDATED EXPORT
  updateNotificationPreferences, // <-- EXPORTED NOTIFICATION TOGGLE UPDATER
  saveBrowserSubscription, // <-- NEW EXPORT
  googleAuthCallback,
  googleAuthLogin,
  disconnectGoogle,
  deleteAccount, // <-- EXPORTED DELETE ACCOUNT
};
