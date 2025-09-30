import mongoose, { Schema } from "mongoose";

const medicationScheduleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "custom"],
      default: "daily",
    },
    times: [
      {
        type: String,
        required: true,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
    googleEventId: {
      type: String,
    },
    notes: {
      type: String,
    },
    missedDoseCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const MedicationSchedule = mongoose.model(
  "MedicationSchedule",
  medicationScheduleSchema
);
