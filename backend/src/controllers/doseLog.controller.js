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

// REVISED: updateDoseLog (Add logic for actualTime)
const updateDoseLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const { status, notes } = req.body; // status will be 'taken' or 'skipped'

  if (!["taken", "missed", "skipped", "snoozed"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const updateFields = { status, notes };

  // 🎯 CRITICAL FIX: Record the time only when marked as taken
  if (status === "taken") {
    updateFields.actualTime = new Date();
  }

  // Note: The 'snoozed' status in your createDoseLog is temporary.
  // For simplicity, we assume the frontend sends 'taken' or 'skipped'.

  const doseLog = await DoseLog.findOneAndUpdate(
    { _id: logId, userId: req.user._id },
    updateFields, // Use the dynamically created update object
    { new: true }
  );

  if (!doseLog) {
    throw new ApiError(404, "Dose log not found");
  }

  // Now returns the updated dose log which the frontend uses to update state
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

// backend/src/controllers/doseLog.controller.js (Simplified getTodaysDoseLogs)

const getTodaysDoseLogs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 🎯 FIX: Query for ALL pending doses, regardless of date, then sort.
  // This eliminates the date math errors and forces the UI to get data if it exists.
  const logs = await DoseLog.find({
    userId,
    status: "pending",
  })
    .populate({
      path: "scheduleId",
      // CRITICAL CHECK: Ensure these fields are correct in your MedicationSchedule model!
      select: "name dosage color",
    })
    .sort({ scheduledFor: 1 });

  // Now you can debug the list of ALL pending doses and see why the UI doesn't like them.
  console.log(`[Dose Log Debug] Found ${logs.length} total pending doses.`);

  // The logs object now holds ALL pending doses. The frontend can filter by today if necessary.
  return res.json(
    new ApiResponse(200, logs, "Today's dose logs retrieved successfully")
  );
});

// NEW FUNCTION: getAdherenceStats (for AdherenceChart.jsx)
const getAdherenceStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  // --- 1. Calculate Overall Statistics (for Pie Chart) ---
  const totalDoses = await DoseLog.countDocuments({
    userId,
    scheduledFor: { $gte: thirtyDaysAgo },
  });

  const statsPipeline = [
    { $match: { userId, scheduledFor: { $gte: thirtyDaysAgo } } },
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

  const adherenceRate =
    totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  // --- 2. Calculate Weekly Trend (for Line Chart) ---
  const weeklyTrendPipeline = [
    { $match: { userId, scheduledFor: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        // Group by week of the year
        _id: { $isoWeek: "$scheduledFor" },
        total: { $sum: 1 },
        taken: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        week: { $concat: ["Week ", { $toString: "$_id" }] },
        rate: {
          $round: [{ $multiply: [{ $divide: ["$taken", "$total"] }, 100] }, 1],
        },
      },
    },
  ];

  const weeklyTrend = await DoseLog.aggregate(weeklyTrendPipeline);

  const finalStats = {
    adherenceRate,
    totalDoses,
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
};
