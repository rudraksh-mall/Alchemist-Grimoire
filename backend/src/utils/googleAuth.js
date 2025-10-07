import { auth } from "./googleClient.js";
import { ApiError } from "./ApiError.js";

// Load environment variables for Google OAuth
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
  process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  // It's critical to crash the server if credentials are not found
  throw new ApiError(
    500,
    "Google OAuth credentials are not set in the environment variables."
  );
}

// 1. Initialize the OAuth client
export const oauth2Client = new auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// 2. Define the scope (required permissions)
// This scope grants read/write access to the user's calendars.
export const SCOPES = ["https://www.googleapis.com/auth/calendar"];
