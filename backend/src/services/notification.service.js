import { MedicationSchedule } from "../models/medicationSchedule.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "./email.service.js";

export const checkAndSendReminders = async () => {
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

    // Find all medication schedules that are due in the next 15 minutes TODO:and not yet taken
    const upcomingDoses = await MedicationSchedule.find({
        time: { $gte: now, $lte: fifteenMinutesLater }
    }).populate("userId");

    for(const dose of upcomingDoses) {
        const user = dose.userId;
        if(!user.email) continue;
        
        const emailContent = {
            to: user.email,
            subject: "⏰ Medication Reminder",
            text: `Hi ${user.name},\n\nThis is a reminder to take your medication: ${dose.name} (${dose.dosage}) at ${dose.scheduledFor}.\n\nStay healthy!\n`,
            html: `<p>Hi ${user.name}<b>,</p>
                    <p>It's time for your dose of <b>${dose.medicationName}</b>.</p>
                    <p><b>Scheduled for:</b> ${new Date(dose.scheduledFor).toLocaleString()}</p>
                    <p>– Circus Crier</p>
                    <p>Stay healthy!</p>`
        };
        await sendEmail(emailContent);
    }
};