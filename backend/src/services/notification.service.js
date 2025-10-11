import { DoseLog } from "../models/doseLog.model.js";
import { sendEmail } from "./email.service.js";
import { User } from "../models/user.model.js";
import webpush from "web-push";

// VAPID Setup (Configure Web Push)
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@alchemist-arena.com", // Sender contact
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendBrowserPush = async (subscription, payload) => {
  try {
    const payloadString = JSON.stringify(payload);
    await webpush.sendNotification(subscription, payloadString);
    console.log("[Notification Service] Browser push sent successfully.");
  } catch (error) {
    console.error(
      "[Notification Service] Browser push failed:",
      error.statusCode || error.message
    );

    if (error.statusCode === 410) {
      console.warn(
        `[Notification Service] Deleting expired subscription for endpoint: ${subscription.endpoint}`
      );
    }
  }
};

export const checkAndSendReminders = async () => {
  // Define the maximum time window (Max 2 hours or 120 minutes, based on UI options)
  const MAX_WINDOW_MINUTES = 120; // This defines the maximum fetch horizon
  const now = new Date();

  // We fetch all doses scheduled in the next two hours, then filter by user preference later.
  const maxReminderWindowEnd = new Date(
    now.getTime() + MAX_WINDOW_MINUTES * 60000
  );

  // This log is now broad to cover all potential reminders
  console.log(
    `[Notification Service] Fetching doses scheduled between ${now.toLocaleTimeString()} and ${maxReminderWindowEnd.toLocaleTimeString()} (Max ${MAX_WINDOW_MINUTES} min horizon)`
  );

  // Find pending doses in that window, populating necessary user fields
  const upcomingDoses = await DoseLog.find({
    status: "pending",
    scheduledFor: { $gte: now, $lte: maxReminderWindowEnd },
  })
    .populate({
      path: "userId",
      model: "User",
      select:
        "email fullName notificationPreferences timezone reminderTimingMinutes browserSubscription",
    })
    // Populate the MedicationSchedule to get the pill name and dosage
    .populate({
      path: "scheduleId",
      model: "MedicationSchedule",
      select: "name dosage",
    });

  if (upcomingDoses.length === 0) {
    return console.log(
      "[Notification Service] No pending reminders found in the next 120 minutes."
    );
  }

  // Group doses by user and apply DYNAMIC REMINDER WINDOW
  const remindersByUser = upcomingDoses.reduce((acc, dose) => {
    if (!dose.userId || !dose.scheduleId) {
      console.warn(
        `[Notification Service] Skipping dose log ${dose._id} due to missing user or schedule data.`
      );
      return acc;
    }

    // Dynamic Reminder Window Check
    const userReminderTime = dose.userId.reminderTimingMinutes || 15; // Default to 15 minutes if field is missing/null

    // The dose is due *userReminderTime* minutes from now.
    const reminderStartThreshold = new Date(
      now.getTime() + userReminderTime * 60000
    );

    // The actual scheduled dose time (stored in DB)
    const doseScheduledTime = new Date(dose.scheduledFor);

    // Check if the dose falls within the 1-minute window just before the scheduled time
    // E.g., if reminderTime is 15 min, we check for doses scheduled 14:00 to 15:59 minutes from now.
    if (
      doseScheduledTime.getTime() > now.getTime() &&
      doseScheduledTime.getTime() <= reminderStartThreshold.getTime()
    ) {
      const userId = dose.userId._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: dose.userId,
          doses: [],
          reminderTiming: userReminderTime, // Store the timing for logging
        };
      }
      acc[userId].doses.push(dose);
    }

    return acc;
  }, {});

  // Send notifications (Email and Browser Push)
  for (const userId in remindersByUser) {
    const { user, doses, reminderTiming } = remindersByUser[userId];

    // Skip if user or essential data is missing
    if (!user || !user.email) {
      console.warn(
        `Skipping reminder for user ${user?.fullName || userId}: Missing email or user data.`
      );
      continue;
    }

    const userTimezone = user.timezone || "UTC";

    // Construct the combined message and formatted times once
    const combinedDosesDetails = doses.map((dose) => {
      const scheduledTime = new Date(dose.scheduledFor).toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "IST",
        }
      );
      return {
        time: scheduledTime,
        name: dose.scheduleId?.name || "Elixir",
        dosage: dose.scheduleId?.dosage || "N/A",
      };
    });

    // Handle EMAIL Notification (If preference is ON)
    if (user.notificationPreferences.email === true) {
      const userName = user.fullName?.split(" ")[0] || "Alchemist";

      // Generate formatted dose rows
      const formattedDoses = combinedDosesDetails
        .map(
          (d) => `
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #4c1d95; font-weight: 600;">${d.time}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${d.name}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${d.dosage}</td>
                </tr>
            `
        )
        .join("");

      const emailContent = {
        to: user.email,
        subject: `⏰ [Circus Crier] ${doses.length} Elixir${doses.length > 1 ? "s" : ""} Due Soon!`,
        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <div style="background-color: #4c1d95; color: white; padding: 25px; text-align: center; border-bottom: 4px solid #7c3aed;">
                            <h1 style="margin: 0; font-size: 24px;">🎪 Alchemist's Grand Grimoire 🔮</h1>
                        </div>
                        
                        <div style="padding: 20px 30px; color: #333;">
                            <p style="font-size: 16px;">Greetings, <b>${userName}</b>!</p>
                            <p style="font-size: 15px; line-height: 1.5;">
                                The <b>Circus Crier</b> sounds the horn! Your vital elixirs are scheduled to be performed soon.
                                Please attend to your <b>${doses.length}</b> upcoming dose${doses.length > 1 ? "s" : ""} with grace and perfect timing.
                            </p>
            
                            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; text-align: left;">
                                <thead style="background-color: #e0e7ff;">
                                    <tr>
                                        <th style="padding: 10px 15px; border-bottom: 2px solid #7c3aed;">Time</th>
                                        <th style="padding: 10px 15px; border-bottom: 2px solid #7c3aed;">Elixir Name</th>
                                        <th style="padding: 10px 15px; border-bottom: 2px solid #7c3aed;">Dosage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${formattedDoses}
                                </tbody>
                            </table>
                            
                            <p style="margin-top: 30px; font-weight: bold; color: #10b981; text-align: center; font-size: 16px;">
                                May your performance be flawless and your spirit soar!
                            </p>
                        </div>
            
                        <div style="background-color: #f5f5f5; padding: 15px 30px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee;">
                            <p style="margin: 0;">✨ This is an automated reminder from the <b>Mystic Fortune Teller</b> ✨</p>
                        </div>
                    </div>
                `,
      };

      await sendEmail(emailContent);
      console.log(
        `[Notification Service] Successfully sent EMAIL to ${user.fullName}.`
      );
    }

    //  Handle BROWSER PUSH Notification (If preference is ON and subscribed)
    if (
      user.notificationPreferences.browser === true &&
      user.browserSubscription
    ) {
      const payload = {
        title: `🎪 ${doses.length} Elixir(s) Due in ${reminderTiming} min!`,
        body: `Your next dose of ${combinedDosesDetails[0].name} is due at ${combinedDosesDetails[0].time}.`,
        icon: "/images/bell.png", // Needs to be served from your public folder
        data: {
          time: combinedDosesDetails[0].time,
          dosesCount: doses.length,
          url: "/dashboard",
        },
      };

      await sendBrowserPush(user.browserSubscription, payload);
    }
  }

  console.log(
    `[Notification Service] Reminders processed for ${Object.keys(remindersByUser).length} users.`
  );
};
