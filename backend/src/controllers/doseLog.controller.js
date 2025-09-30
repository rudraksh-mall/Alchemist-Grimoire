import { DoseLog } from "../models/doseLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Log a dose action (taken, missed, snoozed)
const createDoseLog = asyncHandler(async (req, res) => {
  const { scheduleId, scheduledFor } = req.body;

  if (!scheduleId || !scheduledFor) {
    throw new ApiError(400, "Schedule ID and scheduled time are required");
  }

  const doseLog = await DoseLog.create({
    scheduleId,
    scheduledFor,
    status: "snoozed",
    userId: req.user._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, doseLog, "Dose log created successfully"));
});

// Mark dose as taken/missed/snoozed
const updateDoseLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const { status, notes } = req.body;

  if (!["taken", "missed", "snoozed"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const doseLog = await DoseLog.findOneAndUpdate(
    { _id: logId, userId: req.user._id },
    { status, notes },
    { new: true }
  );

  if (!doseLog) {
    throw new ApiError(404, "Dose log not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, doseLog, "Dose log updated successfully"));
});

// Get dose logs for a specific medication schedule
const getDoseLogsBySchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;

  const doseLogs = await DoseLog.find({ scheduleId, userId: req.user._id }).sort({ scheduledFor: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, doseLogs, "Dose logs retrieved successfully"));
});

// Get todays dose logs
const getTodaysDoseLogs = asyncHandler(async (req, res) => {
  const today = new Date();
  const logs = await DoseLog.find({
    userId: req.user._id,
    today
  });
  return res.json(new ApiResponse(200, logs, "Today's dose logs retrieved successfully"));
});

export {
  createDoseLog,
  updateDoseLog,
  getDoseLogsBySchedule,
  getTodaysDoseLogs
};
