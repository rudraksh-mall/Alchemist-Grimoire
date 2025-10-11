import { User } from "../models/user.model.js";
import { createInitialDoses } from "../services/doseCreation.service.js";
import {
  createCalendarEvent,
  deleteCalendarEvent,
} from "../services/calendar.service.js";
import { MedicationSchedule } from "../models/medicationSchedule.model.js";
import { DoseLog } from "../models/doseLog.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createMedicationSchedule = asyncHandler(async (req, res) => {
  const { name, dosage, frequency, times, startDate, endDate, notes } =
    req.body;

  // Validation
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

  // Create Schedule in MongoDB
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

  // Create Initial Dose Logs
  await createInitialDoses(schedule);

  // GOOGLE CALENDAR SYNC

  // Fetch the user's Google Refresh Token and Timezone (needed for event creation)
  const user = await User.findById(req.user._id).select(
    "googleRefreshToken timezone"
  );

  if (user && user.googleRefreshToken) {
    try {
      // Call the service to create the event using the token
      const eventId = await createCalendarEvent(
        schedule,
        user.googleRefreshToken
      );

      // Save the Google Event ID back to the schedule in MongoDB
      await MedicationSchedule.findByIdAndUpdate(schedule._id, {
        googleEventId: eventId,
      });

      console.log(
        `[Google Sync] Event created for ${schedule.name} with ID: ${eventId}`
      );
    } catch (syncError) {
      // Log the error but DO NOT crash the server (non-critical feature failure)
      console.error(
        "[Google Sync ERROR] Failed to create calendar event:",
        syncError.message
      );
    }
  }

  // Final Response
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
  const { scheduleId } = req.params; // Find the schedule BEFORE deletion to get the Google Event ID
  const schedule = await MedicationSchedule.findOne({
    _id: scheduleId,
    userId: req.user._id,
  }).select("googleEventId"); // Only fetch the ID we need

  if (!schedule) {
    throw new ApiError(404, "Medication schedule not found");
  }

  // GOOGLE CALENDAR SYNC DELETION
  // Check if a Google Event ID exists on the schedule
  if (schedule.googleEventId) {
    // Fetch the user's refresh token needed for the deletion service
    const user = await User.findById(req.user._id).select("googleRefreshToken");

    if (user && user.googleRefreshToken) {
      try {
        // Call the new service to delete the event
        await deleteCalendarEvent(
          schedule.googleEventId,
          user.googleRefreshToken
        );
      } catch (syncError) {
        // Log the error but DO NOT crash the server (non-critical feature failure)
        console.error(
          "[Google Sync ERROR] Failed to execute calendar deletion:",
          syncError.message
        );
      }
    }
  }
  // Delete from MongoDB
  await MedicationSchedule.deleteOne({ _id: scheduleId, userId: req.user._id });
  // Delete associated dose logs

  await DoseLog.deleteMany({ scheduleId: scheduleId });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Medication schedule and associated Google event deleted successfully"
      )
    );
});

export {
  createMedicationSchedule,
  getMedicationSchedules,
  getMedicationScheduleById,
  updateMedicationSchedule,
  deleteMedicationSchedule,
};
