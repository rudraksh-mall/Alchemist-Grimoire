import { DoseLog } from "../models/doseLog.model.js"; // Import DoseLog model
import { sendEmail } from "./email.service.js";
// Assuming you have a User model imported via the controllers or services that rely on it
// import { User } from "../models/user.model.js"; // (Not strictly needed here if populate works)

export const checkAndSendReminders = async () => {
    // 1. Define the time window (next 15 minutes)
    const now = new Date();
    // Schedule check for pending doses 1 minute from now up to 15 minutes from now
    const reminderWindowStart = new Date(now.getTime() + 60000); 
    const reminderWindowEnd = new Date(now.getTime() + 15 * 60000); 
    
    console.log(`[Notification Service] Checking for doses scheduled between ${reminderWindowStart.toLocaleTimeString()} and ${reminderWindowEnd.toLocaleTimeString()}`);


    // 2. Find pending doses in that window, populating user and schedule details
    const upcomingDoses = await DoseLog.find({
        status: 'pending', // Only send reminders for doses not yet taken
        scheduledFor: { $gte: reminderWindowStart, $lte: reminderWindowEnd }
    })
    // Populate the User to get the email and notification preferences
    .populate({ path: 'userId', model: 'User', select: 'email fullName notificationPreferences' }) 
    // Populate the MedicationSchedule to get the pill name and dosage
    .populate({ path: 'scheduleId', model: 'MedicationSchedule', select: 'name dosage' }); 

    if (upcomingDoses.length === 0) {
        return console.log("[Notification Service] No pending reminders found in the next 15 minutes.");
    }
    
    // Group doses by user to send one combined email per user (more efficient)
    const remindersByUser = upcomingDoses.reduce((acc, dose) => {
        // 🎯 CRITICAL FIX: Ensure user and schedule data exists before processing (prevents crash on null populate)
        if (!dose.userId || !dose.scheduleId) {
            console.warn(`[Notification Service] Skipping dose log ${dose._id} due to missing user or schedule data.`);
            return acc;
        }
        
        const userId = dose.userId._id.toString();
        if (!acc[userId]) {
            acc[userId] = {
                user: dose.userId,
                doses: []
            };
        }
        acc[userId].doses.push(dose);
        return acc;
    }, {});


    // 3. Send emails
    for (const userId in remindersByUser) {
        const { user, doses } = remindersByUser[userId];
        
        // 🎯 Preference Check: Skip if user has not opted into email or if essential data is missing
        if (!user || !user.email || user.notificationPreferences.email === false) {
            console.warn(`Skipping email reminder for user ${user?.fullName || userId}: Not opted into email notifications or missing email.`);
            continue;
        }

        const formattedDoses = doses.map(dose => {
            // Defensive check for safety in the map
            if (!dose.scheduleId) {
                return '';
            }

            const scheduledTime = new Date(dose.scheduledFor).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            const name = dose.scheduleId.name || 'Elixir'; 
            const dosage = dose.scheduleId.dosage || '';

            return `
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-weight: bold; color: #7c3aed;">${scheduledTime}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${name}</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #eee;">${dosage}</td>
                </tr>
            `;
        }).join('');

        const userName = user.fullName || 'Brave Performer';

        const emailContent = {
            to: user.email,
            subject: `⏰ [Circus Crier] ${doses.length} Elixir(s) Due Soon!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <div style="background-color: #4c1d95; color: white; padding: 25px; text-align: center; border-bottom: 4px solid #7c3aed;">
                        <h1 style="margin: 0; font-size: 24px;">🎪 Alchemist's Grand Grimoire 🔮</h1>
                    </div>
                    
                    <div style="padding: 20px 30px; color: #333;">
                        <p style="font-size: 16px;">Greetings, <b>${userName}</b>!</p>
                        <p style="font-size: 15px; line-height: 1.5;">
                            The <b>Circus Crier</b> sounds the horn! Your vital elixirs are scheduled to be performed soon.
                            Please attend to your <b>${doses.length}</b> upcoming dose(s) with grace and perfect timing.
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
                        <p style="margin: 0;">*This is an automated reminder from the Mystic Fortune Teller.*</p>
                    </div>
                </div>
            `,
        };
        await sendEmail(emailContent);
        
        // Log that the user was successfully processed for reminders
        console.log(`[Notification Service] Successfully sent ${doses.length} reminders to ${user.fullName || userId}.`);
    }
    
    console.log(`[Notification Service] Reminders processed for ${Object.keys(remindersByUser).length} users.`);
};
