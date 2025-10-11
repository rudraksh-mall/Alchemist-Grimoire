import dotenv from "dotenv";

// mongodb connection
import connectDB from "./db/connection.js";
// dotenv for env variables access throughout the project
dotenv.config({ path: "./.env" });

// this file will handle core routing logic and route controllers
import { app } from "./app.js";

import { startCronJobs } from "./db/cron.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`✅ Server is running on port ${process.env.PORT || 8000}`);
      // Start cron jobs after the server is up and running
      startCronJobs();
    });
  })
  .catch((error) => {
    console.log("❌ MONGODB connection FAILED:", error);
  });
