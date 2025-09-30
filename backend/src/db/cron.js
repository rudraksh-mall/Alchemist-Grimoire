import cron from "node-cron";
import { checkAndSendReminders } from "../services/notification.service.js";

// Run every 1 minute
export const startCronJobs = () => {
    cron.schedule("* * * * *", async () => {
        console.log("⏳ Checking for upcoming reminders...");
        await checkAndSendReminders();
    });
};