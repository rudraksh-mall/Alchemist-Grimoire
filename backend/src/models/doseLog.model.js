import mongoose, { Schema } from "mongoose";

const doseLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "MedicationSchedule",
      required: true,
      index: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["taken", "missed", "snoozed", "pending", "skipped"],
      required: true,
    },

    actionedAt: {
      type: Date,
      validate: {
        validator: function (v) {
          // Only validate if status is 'taken' AND value 'v' exists
          return this.status !== "taken" || (v && v >= this.scheduledFor);
        },
        message: "actionedAt cannot be before scheduledFor",
      },
    },

    notes: {
      type: String,
    },

    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const DoseLog = mongoose.model("DoseLog", doseLogSchema);
