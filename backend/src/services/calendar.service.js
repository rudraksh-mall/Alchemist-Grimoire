// backend/src/services/calendar.service.js

import { calendar as calendarModule } from "../utils/googleClient.js";
import { oauth2Client } from "../utils/googleAuth.js";

const calendar = calendarModule({ version: "v3", auth: oauth2Client });

/**
 * Creates a recurring event in the user's Google Calendar.
 * @param {object} schedule - The MedicationSchedule document from MongoDB.
 * @param {string} refreshToken - The user's stored Google Refresh Token.
 */
export const createCalendarEvent = async (schedule, refreshToken) => {
  // 1. Set the credentials for the specific user using their stored Refresh Token
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // 2. Define recurrence rule (RRULE) based on schedule frequency
  // NOTE: This is a simplified RRULE. Complex schedules (e.g., specific days) need advanced parsing.
  const frequencyMap = {
    "once daily": "DAILY",
    "twice daily": "DAILY",
    "three times daily": "DAILY",
    "four times daily": "DAILY",
    weekly: "WEEKLY",
  };

  const recurrenceRule = `RRULE:FREQ=${frequencyMap[schedule.frequency] || "DAILY"}`;

  // 3. Construct the event object
  // We use the first scheduled time/date as the base for the recurring event
  const startTime = schedule.times[0] || "09:00";
  const startDateISO = new Date(schedule.startDate).toISOString().split("T")[0];

  const event = {
    summary: `💊 ${schedule.name} (${schedule.dosage})`,
    description: `Time to take your scheduled dose. Sync managed by Alchemist's Grimoire.`,
    start: {
      dateTime: `${startDateISO}T${startTime}:00`,
      timeZone: schedule.userId.timezone || "UTC", // Use user's stored timezone
    },
    end: {
      // Event lasts 5 minutes for simplicity
      dateTime: `${startDateISO}T${startTime}:05`,
      timeZone: schedule.userId.timezone || "UTC",
    },
    recurrence: [recurrenceRule],
    colorId: 9, // A pleasant purple/grape color for events
  };

  // 4. Insert the event into the user's primary calendar
  const response = await calendar.events.insert({
    calendarId: "primary", // Default to primary calendar
    resource: event,
    sendNotifications: true,
  });

  // Return the Google Event ID for potential later deletion/updates
  return response.data.id;
};
