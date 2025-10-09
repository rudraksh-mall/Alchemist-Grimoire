// backend/src/services/calendar.service.js

import { calendar as calendarModule } from "../utils/googleClient.js";
import { oauth2Client } from "../utils/googleAuth.js";

const calendar = calendarModule({ version: "v3", auth: oauth2Client });

/**
 * Creates a recurring event in the user's Google Calendar.
 * @param {object} schedule - The MedicationSchedule document from MongoDB (populated with user timezone).
 * @param {string} refreshToken - The user's stored Google Refresh Token.
 */
export const createCalendarEvent = async (schedule, refreshToken) => {
  // 1. Set the credentials for the specific user using their stored Refresh Token
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // 2. Define recurrence rule (RRULE) based on schedule frequency and end date
  const frequencyMap = {
    "once daily": "DAILY",
    "twice daily": "DAILY",
    "three times daily": "DAILY",
    "four times daily": "DAILY",
    weekly: "WEEKLY",
  };

  let recurrenceRule = `RRULE:FREQ=${frequencyMap[schedule.frequency] || "DAILY"}`;
  
  // 🎯 FIX: Add UNTIL clause if endDate exists
  if (schedule.endDate) {
    const endDateObj = new Date(schedule.endDate);
    
    // Google RRULE UNTIL format is YYYYMMDDTHHMMSSZ. 
    // We set the time to the end of the day (23:59:59 UTC) to ensure the last day is included.
    endDateObj.setUTCHours(23, 59, 59, 0); 
    
    // Format to YYYYMMDDTHHMMSSZ
    const untilDate = endDateObj.toISOString().replace(/[-:]|\.\d{3}/g, '');
    
    // Append the UNTIL clause to the RRULE
    recurrenceRule += `;UNTIL=${untilDate}`;
  }

  // 3. Construct the event object
  // We use the first scheduled time/date as the base for the recurring event
  const startTime = schedule.times[0] || "09:00";
  // The schedule.startDate from the FE is already YYYY-MM-DD
  const startDateISO = new Date(schedule.startDate).toISOString().split("T")[0];

  // We assume schedule.userId is populated or accessible here, and has a timezone property.
  // This value should be the user's timezone string (e.g., 'America/New_York').
  const userTimezone = schedule.userId?.timezone || "UTC"; 

  const event = {
    summary: `💊 ${schedule.name} (${schedule.dosage})`,
    description: `Time to take your scheduled dose. Sync managed by Alchemist's Grimoire.`,
    start: {
      dateTime: `${startDateISO}T${startTime}:00`,
      timeZone: userTimezone, 
    },
    end: {
      // Event lasts 5 minutes for simplicity
      dateTime: `${startDateISO}T${startTime.split(':')[0]}:${parseInt(startTime.split(':')[1]) + 5}:00`,
      timeZone: userTimezone,
    },
    recurrence: [recurrenceRule], // Contains the UNTIL clause if applicable
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
