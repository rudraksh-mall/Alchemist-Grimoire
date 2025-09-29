import dotenv from "dotenv";

// mongodb connection
import connectDB from "./db/connection.js";

// this file will handle core routing logic and route controllers
import { app } from "./app.js";

// dotenv for env variables access throughout the project
dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8000;

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log("ERRR: ", error);
        throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((error) => {
    console.log("MONGODB connection FAILED:", error);
})