import { calendar as calendarModule } from "../utils/googleClient.js";
import { oauth2Client } from "../utils/googleAuth.js";

const calendar = calendarModule({ version: "v3", auth: oauth2Client });

export const createCalendarEvent = async (schedule, refreshToken) => {
  //  Set the credentials for the specific user using their stored Refresh Token
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  //  Define recurrence rule (RRULE) based on schedule frequency and end date
  const frequencyMap = {
    "once daily": "DAILY",
    "twice daily": "DAILY",
    "three times daily": "DAILY",
    "four times daily": "DAILY",
    weekly: "WEEKLY",
  };

  let recurrenceRule = `RRULE:FREQ=${frequencyMap[schedule.frequency] || "DAILY"}`;

  if (schedule.endDate) {
    const endDateObj = new Date(schedule.endDate);

    // Google RRULE UNTIL format is YYYYMMDDTHHMMSSZ.
    // We set the time to the end of the day (23:59:59 UTC) to ensure the last day is included.
    endDateObj.setUTCHours(23, 59, 59, 0);

    // Format to YYYYMMDDTHHMMSSZ
    const untilDate = endDateObj.toISOString().replace(/[-:]|\.\d{3}/g, "");

    // Append the UNTIL clause to the RRULE
    recurrenceRule += `;UNTIL=${untilDate}`;
  }

  //  Construct the event object
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
      timeZone: "IST",
    },
    end: {
      // Event lasts 5 minutes for simplicity
      dateTime: `${startDateISO}T${startTime.split(":")[0]}:${parseInt(startTime.split(":")[1]) + 5}:00`,
      timeZone: "IST",
    },
    recurrence: [recurrenceRule], // Contains the UNTIL clause if applicable
    colorId: 9, // A pleasant purple/grape color for events
  };

  //  Insert the event into the user's primary calendar
  const response = await calendar.events.insert({
    calendarId: "primary", // Default to primary calendar
    resource: event,
    sendNotifications: true,
  });

  // Return the Google Event ID for potential later deletion/updates
  return response.data.id;
};

export const deleteCalendarEvent = async (
  googleEventId,
  refreshToken,
  calendarId = "primary"
) => {
  // Set the credentials for the specific user
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: googleEventId,
      sendNotifications: true, // Optional: Sends cancellation notice
    });
    console.log(
      `[Google Sync] Event ID ${googleEventId} successfully deleted.`
    );
    return true;
  } catch (error) {
    if (error.code === 404) {
      console.warn(
        `[Google Sync WARNING] Event ID ${googleEventId} not found in Google Calendar. Skipping deletion.`
      );
      return true;
    }
    console.error(
      `[Google Sync ERROR] Failed to delete calendar event ${googleEventId}:`,
      error.message
    );
    return false;
  }
};

