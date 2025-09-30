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
      enum: ["taken", "missed", "snoozed"],
      required: true,
    },

    actionedAt: {
      type: Date,
      default: Date.now,
      validate: {
        validator: function (v) {
          return !v || v >= this.scheduledFor;
        },
        message: "actionedAt cannot be before scheduledFor",
      },
    },

    notes: {
      type: String, // reason for missing
    },

    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const DoseLog = mongoose.model("DoseLog", doseLogSchema);
