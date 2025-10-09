import { DoseLog } from "../models/doseLog.model.js";

/**
 * Creates a batch of DoseLog entries for the upcoming horizon (e.g., 7 days).
 * It calculates the scheduled time by combining the schedule's date and time components,
 * ensuring the time is interpreted in the server's local context before being saved as UTC.
 * * @param {Object} schedule - The medication schedule object.
 */
export const createInitialDoses = async (schedule) => {
  const dosesToCreate = [];

  // 1. Normalize dates to local midnight for stable calendar day comparison
  // NOTE: When dealing with user input, it's safest to define the "calendar day" 
  // based on the server's local timezone unless the user's timezone is known.
  const startDate = new Date(schedule.startDate);
  const today = new Date();
  
  // Set both dates to LOCAL midnight (00:00:00) to establish a consistent calendar start point
  startDate.setHours(0, 0, 0, 0); 
  today.setHours(0, 0, 0, 0); 

  // Determine the actual start day (today or the schedule start date, whichever is later)
  const startDayTimestamp = Math.max(startDate.getTime(), today.getTime());
  const startDay = new Date(startDayTimestamp);

  const horizonDays = 7;
  const validTimes = schedule.times.filter((t) => t && t.includes(":"));

  for (let i = 0; i < horizonDays; i++) {
    // Create a new date object for the iteration day (startDay + i days)
    const iterationDate = new Date(startDay);
    // Use LOCAL date methods to advance the day
    iterationDate.setDate(startDay.getDate() + i);

    validTimes.forEach((timeString) => {
      const parts = timeString.split(":");
      if (parts.length !== 2) {
        console.warn(
          `[Circus Crier] Skipping invalid time format: ${timeString}`
        );
        return;
      }

      const [hours, minutes] = parts.map(Number);

      // Create the FINAL scheduled time using the LOCAL-normalized iteration date as the base
      const scheduledTime = new Date(iterationDate);
      
      // *** CRITICAL FIX: Use setHours() instead of setUTCHours() ***
      // setHours interprets 'hours' and 'minutes' in the server's local time zone.
      // MongoDB/Mongoose will then automatically convert this moment to the correct
      // UTC timestamp for storage, which is necessary for the time comparisons 
      // in notification.service.js to work correctly.
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Final check: Ensure we don't schedule a dose before the medicine's start date
      if (scheduledTime.getTime() >= new Date(schedule.startDate).getTime()) {
        dosesToCreate.push({
          userId: schedule.userId,
          scheduleId: schedule._id,
          // scheduledFor is now a robust UTC timestamp representing the local time
          scheduledFor: scheduledTime, 
          status: "pending",
        });
      }
    });
  }

  if (dosesToCreate.length > 0) {
    try {
      await DoseLog.insertMany(dosesToCreate);
      console.log(
        `[Circus Crier] Created ${dosesToCreate.length} initial doses for schedule: ${schedule.name}`
      );
    } catch (error) {
      // Handle potential duplicate key error (11000) if cron job runs twice
      // This often happens if the collection has a unique index on (scheduleId, scheduledFor, userId)
      if (error.code !== 11000) { 
         console.error("[Circus Crier CRASHED] Dose Insertion Failed:", error);
         throw error;
      } else {
         console.warn("[Circus Crier] Duplicate dose insert attempted and ignored.");
      }
    }
  }
};