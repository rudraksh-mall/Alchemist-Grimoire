// backend/src/services/doseCreation.service.js (FINAL CORRECTED VERSION)

import { DoseLog } from "../models/doseLog.model.js";

export const createInitialDoses = async (schedule) => {
  const dosesToCreate = [];

  // Use the schedule's START DATE (or today, if the schedule started earlier)
  const startDate = new Date(schedule.startDate);
  const today = new Date();

  // Determine the actual start day (today or the schedule start date, whichever is later)
  const startDayTimestamp = Math.max(startDate.getTime(), today.getTime());
  const startDay = new Date(startDayTimestamp);
  startDay.setHours(0, 0, 0, 0); // Normalize start date to midnight

  const horizonDays = 7;
  const validTimes = schedule.times.filter((t) => t && t.includes(":"));

  for (let i = 0; i < horizonDays; i++) {
    // Create a new, stable date object for the iteration day (i.e., today + i days)
    const iterationDate = new Date(startDay);
    iterationDate.setDate(startDay.getDate() + i);
    iterationDate.setHours(0, 0, 0, 0); // Ensure clean start of the day

    validTimes.forEach((timeString) => {
      const parts = timeString.split(":");
      if (parts.length !== 2) {
        console.warn(
          `[Circus Crier] Skipping invalid time format: ${timeString}`
        );
        return;
      }

      const [hours, minutes] = parts.map(Number);

      // Create the FINAL scheduled time using the iteration date as the base
      const scheduledTime = new Date(iterationDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Double check: Ensure we don't schedule a dose before the official start date
      if (scheduledTime.getTime() >= new Date(schedule.startDate).getTime()) {
        dosesToCreate.push({
          userId: schedule.userId,
          scheduleId: schedule._id,
          // 🎯 FIX: scheduledFor is guaranteed to be a valid Date object here
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
      console.error("[Circus Crier CRASHED] Dose Insertion Failed:", error);
      throw error;
    }
  }
};
