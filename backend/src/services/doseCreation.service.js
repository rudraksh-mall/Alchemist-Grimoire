import { DoseLog } from "../models/doseLog.model.js";

export const createInitialDoses = async (schedule) => {
  const dosesToCreate = [];

  // 1. Normalize dates to UTC midnight for stable calendar day comparison
  const startDate = new Date(schedule.startDate);
  const today = new Date();
  
  // Set both dates to UTC midnight to establish a consistent calendar start point
  // This ensures the calendar day (YYYY-MM-DD) is calculated consistently.
  startDate.setUTCHours(0, 0, 0, 0); 
  today.setUTCHours(0, 0, 0, 0); 

  // Determine the actual start day (today or the schedule start date, whichever is later)
  const startDayTimestamp = Math.max(startDate.getTime(), today.getTime());
  const startDay = new Date(startDayTimestamp);

  const horizonDays = 7;
  const validTimes = schedule.times.filter((t) => t && t.includes(":"));

  for (let i = 0; i < horizonDays; i++) {
    // Create a new date object for the iteration day (startDay + i days)
    const iterationDate = new Date(startDay);
    // Use UTC date methods to ensure the day change is correct regardless of local time zone
    iterationDate.setUTCDate(startDay.getUTCDate() + i);

    validTimes.forEach((timeString) => {
      const parts = timeString.split(":");
      if (parts.length !== 2) {
        console.warn(
          `[Circus Crier] Skipping invalid time format: ${timeString}`
        );
        return;
      }

      const [hours, minutes] = parts.map(Number);

      // Create the FINAL scheduled time using the UTC-normalized iteration date as the base
      const scheduledTime = new Date(iterationDate);
      // Set the time using UTC methods to define the precise moment in UTC
      scheduledTime.setUTCHours(hours, minutes, 0, 0);

      // Final check: Ensure we don't schedule a dose before the medicine's start date
      if (scheduledTime.getTime() >= new Date(schedule.startDate).getTime()) {
        dosesToCreate.push({
          userId: schedule.userId,
          scheduleId: schedule._id,
          // scheduledFor is now a UTC timestamp
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
      if (error.code !== 11000) { 
         console.error("[Circus Crier CRASHED] Dose Insertion Failed:", error);
         throw error;
      } else {
         console.warn("[Circus Crier] Duplicate dose insert attempted and ignored.");
      }
    }
  }
};
