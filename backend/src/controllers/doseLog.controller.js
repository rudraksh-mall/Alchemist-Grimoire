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
    userId: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, doseLog, "Dose log created successfully"));
});

// REVISED: updateDoseLog (Add logic for actualTime and Snooze)
const updateDoseLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const { status, notes, snoozeDurationMinutes } = req.body; // status, notes, AND snooze duration

  if (!["taken", "missed", "skipped", "snoozed"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  let updateFields = { status, notes };

  if (status === "taken" || status === "skipped" || status === "missed") {
    updateFields.actualTime = new Date();
  }

  // 🎯 FIX: Snooze Logic
  if (status === "snoozed") {
    const dose = await DoseLog.findOne({ _id: logId, userId: req.user._id });
    if (!dose) {
      throw new ApiError(404, "Dose log not found for snoozing");
    }

    const currentScheduledTime = dose.scheduledFor.getTime(); // Get time in milliseconds
    const snoozeDelayMs = (snoozeDurationMinutes || 30) * 60 * 1000; // Default to 30 min
    const newScheduledTime = new Date(currentScheduledTime + snoozeDelayMs);

    // Update the field to reschedule the dose
    updateFields = {
      status: "pending", // Snoozing sets the status back to pending
      scheduledFor: newScheduledTime,
    };
  }

  // Find the log and apply updates
  const doseLog = await DoseLog.findOneAndUpdate(
    { _id: logId, userId: req.user._id },
    updateFields,
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

  const doseLogs = await DoseLog.find({
    scheduleId,
    userId: req.user._id,
  }).sort({ scheduledFor: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, doseLogs, "Dose logs retrieved successfully"));
});

// backend/src/controllers/doseLog.controller.js (Final Fix for getTodaysDoseLogs)

// FIX: Correctly filter by today's date and current time
const getTodaysDoseLogs = asyncHandler(async (req, res) => {
  // 🎯 NEW LOG: Check if the route is hit at all
  console.log(
    `[DoseLog Controller] Route /v1/dose-logs/today accessed by User: ${req.user._id}`
  );

  const userId = req.user._id;

  // 1. Calculate today's date boundaries in UTC (to match doseCreation.service.js)
  // Get current date, then normalize it to UTC midnight (start of today)
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  // Get start of tomorrow (end of today)
  const endOfToday = new Date(startOfToday);
  endOfToday.setUTCDate(startOfToday.getUTCDate() + 1);

  // 2. Query for pending logs scheduled for TODAY AND the CURRENT MOMENT (or later)
  const logs = await DoseLog.find({
    userId,
    status: "pending",
    // 🎯 FINAL ROBUST FIX: Ensure the dose is scheduled for today's calendar day
    scheduledFor: {
      $gte: new Date(Date.now() - 60000), // Future or within the last 60 seconds (safe buffer)
      $lt: endOfToday,
    },
  })
    .populate({
      path: "scheduleId",
      // CRITICAL CHECK: Ensure these fields are correct in your MedicationSchedule model!
      select: "name dosage color",
    })
    .sort({ scheduledFor: 1 }); // Sort by time ascending

  // 3. Removed redundant client-side filtering. MongoDB handles the future-time check.

  console.log(
    `[Dose Log Debug] Found ${logs.length} upcoming doses for client.`
  );

  // 🎯 NEW LOG: Output the entire response array to the console
  console.log("[Dose Log Response Data]", logs);

  return res.json(
    new ApiResponse(200, logs, "Today's dose logs retrieved successfully")
  );
});

const getAllDoseLogs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const doseLogs = await DoseLog.find({ userId })
    .populate({
      path: "scheduleId",
      select: "name dosage color",
    })
    .sort({ scheduledFor: -1 }); // Sort newest first for history

  return res.json(
    new ApiResponse(200, doseLogs, "All dose logs retrieved successfully")
  );
});
// NEW FUNCTION: getAdherenceStats (for AdherenceChart.jsx)
const getAdherenceStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  // --- 1. Calculate Overall Statistics (for Pie Chart) ---
  // We use the aggregation pipeline to get counts for only COMPLETED statuses
  const statsPipeline = [
    {
      $match: {
        userId,
        scheduledFor: { $gte: thirtyDaysAgo },
        status: { $in: ["taken", "missed", "skipped"] }, // Filter for completed actions
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ];

  const results = await DoseLog.aggregate(statsPipeline);

  const takenDoses = results.find((r) => r._id === "taken")?.count || 0;
  const missedDoses = results.find((r) => r._id === "missed")?.count || 0;
  const skippedDoses = results.find((r) => r._id === "skipped")?.count || 0;

  // 🎯 FIX: Calculate total completed doses for the denominator
  const totalCompletedDoses = takenDoses + missedDoses + skippedDoses;

  const adherenceRate =
    totalCompletedDoses > 0
      ? Math.round((takenDoses / totalCompletedDoses) * 100)
      : 0;

  // --- 2. Calculate Weekly Trend (for Line Chart) ---
  const weeklyTrendPipeline = [
    // 🎯 CRITICAL FIX: Match only COMPLETED doses first to get accurate weekly totals
    {
      $match: {
        userId,
        scheduledFor: { $gte: thirtyDaysAgo },
        status: { $in: ["taken", "missed", "skipped"] }, // Only include completed doses
      },
    },
    {
      $group: {
        // Group by week of the year
        _id: { $isoWeek: "$scheduledFor" },
        // Now 'total' correctly represents total COMPLETED doses for the week
        total: { $sum: 1 },
        taken: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        week: { $concat: ["Week ", { $toString: "$_id" }] },
        // Denominator ($total) is now correct (Total Completed Doses)
        rate: {
          $round: [{ $multiply: [{ $divide: ["$taken", "$total"] }, 100] }, 1],
        },
      },
    },
  ];

  const weeklyTrend = await DoseLog.aggregate(weeklyTrendPipeline);

  const finalStats = {
    adherenceRate,
    totalDoses: totalCompletedDoses, // Return completed count to the client for overall stats
    takenDoses,
    missedDoses,
    skippedDoses,
    weeklyTrend, // This feeds directly into the AdherenceChart LineChart
  };

  return res.json(
    new ApiResponse(200, finalStats, "Adherence stats retrieved successfully")
  );
});

export {
  createDoseLog,
  updateDoseLog,
  getDoseLogsBySchedule,
  getTodaysDoseLogs,
  getAdherenceStats,
  getAllDoseLogs,
};
