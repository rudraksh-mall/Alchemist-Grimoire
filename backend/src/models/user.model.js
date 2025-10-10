import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    // --- NEW FIELDS FOR OTP VERIFICATION ---
    emailVerificationToken: {
      type: String, // Stores the hashed OTP
      default: null,
    },
    emailVerificationExpires: {
      type: Date, // Stores the time the OTP expires
      default: null,
    },
    // Optional: Flag to remember the user is verified (can be useful for registration flow)
    isVerified: {
      type: Boolean,
      default: false,
    },
    // ----------------------------------------

    timezone: {
      type: String,
      default: "UTC",
    },

    // === NEW FIELD: Custom Reminder Timing ===
    reminderTimingMinutes: {
      type: Number,
      default: 15, // Defaulting to 15 minutes before the dose
      min: 5,
      max: 120, // Max of 2 hours, based on frontend options
    },
    // =========================================

    notificationPreferences: {
      browser: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      // sms: { type: Boolean, default: true } // Can be added later if needed
    },

    // --- NEW FIELD: Browser Push Subscription ---
    browserSubscription: {
      type: {
        // The unique push endpoint provided by the browser (required for Web Push)
        endpoint: { type: String, trim: true },
        // The time when the subscription should expire
        expirationTime: { type: Date, default: null },
        keys: {
          // Encryption key for payload data
          p256dh: { type: String, trim: true },
          // Authentication secret
          auth: { type: String, trim: true },
        },
      },
      // Use null to explicitly indicate that the user has not subscribed or has unsubscribed
      default: null,
    },
    // --- END NEW FIELD ---

    googleRefreshToken: {
      type: String,
      default: null, // Stores the permanent token needed for calendar access
    },

    googleCalendarId: {
      type: String,
      default: "primary", // Stores the ID of the calendar to sync to
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model("User", userSchema);
