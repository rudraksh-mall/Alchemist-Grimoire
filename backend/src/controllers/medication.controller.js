import { createInitialDoses } from "../services/doseCreation.service.js";
import { MedicationSchedule } from "../models/medicationSchedule.model.js";
import { DoseLog } from "../models/doseLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// REVISED: createMedicationSchedule (WITH DOSE CREATION INTEGRATION)
const createMedicationSchedule = asyncHandler(async (req, res) => {
  const { name, dosage, frequency, times, startDate, endDate, notes } =
    req.body;

  if (
    !name ||
    !dosage ||
    !frequency ||
    !startDate ||
    !times ||
    times.length === 0
  ) {
    throw new ApiError(
      400,
      "Name, dosage, frequency, start date, and at least one time are required"
    );
  }

  const schedule = await MedicationSchedule.create({
    name,
    dosage,
    frequency,
    times,
    startDate,
    endDate,
    notes,
    userId: req.user._id,
  });

  // 🎯 CRITICAL FIX: CALL THE DOSE CREATION SERVICE 🎯
  // This creates the initial DoseLog entries that the frontend fetches.
  await createInitialDoses(schedule);

  return res
    .status(201)
    .json(
      new ApiResponse(201, schedule, "Medication schedule created successfully")
    );
});

// Get all medication schedules for the authenticated user
const getMedicationSchedules = asyncHandler(async (req, res) => {
  const schedules = await MedicationSchedule.find({ userId: req.user._id });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        schedules,
        "Medication schedules retrieved successfully"
      )
    );
});

// Get a specific medication schedule by ID
const getMedicationScheduleById = asyncHandler(async (req, res) => {
  const schedule = await MedicationSchedule.findOne({
    _id: req.params.scheduleId,
    userId: req.user._id,
  });
  if (!schedule) {
    throw new ApiError(404, "Medication schedule not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        schedule,
        "Medication schedule retrieved successfully"
      )
    );
});

// Update a medication schedule by ID
const updateMedicationSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const updates = req.body;

  const schedule = await MedicationSchedule.findOneAndUpdate(
    { _id: scheduleId, userId: req.user._id },
    updates,
    { new: true }
  );

  if (!schedule) {
    throw new ApiError(404, "Medication schedule not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, schedule, "Medication schedule updated successfully")
    );
});

// Delete a medication schedule by ID
const deleteMedicationSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const schedule = await MedicationSchedule.findOneAndDelete({
    _id: scheduleId,
    userId: req.user._id,
  });
  if (!schedule) {
    throw new ApiError(404, "Medication schedule not found");
  }
  // Optionally, delete associated dose logs
  await DoseLog.deleteMany({ scheduleId: scheduleId });
  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Medication schedule deleted successfully")
    );
});

export {
  createMedicationSchedule,
  getMedicationSchedules,
  getMedicationScheduleById,
  updateMedicationSchedule,
  deleteMedicationSchedule,
};
