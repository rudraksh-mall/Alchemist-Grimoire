import { Router } from "express";
import {
    createDoseLog,
    updateDoseLog,
    getDoseLogsBySchedule,
    getTodaysDoseLogs
} from "../controllers/doseLog.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.post("/", createDoseLog);
router.put("/:logId", updateDoseLog);
router.get("/schedule/:scheduleId", getDoseLogsBySchedule);
router.get("/today", getTodaysDoseLogs);

export default router;