// backend/routes/doseLog.routes.js

import { Router } from "express";
import {
  createDoseLog,
  updateDoseLog,
  getDoseLogsBySchedule,
  getTodaysDoseLogs,
  getAdherenceStats,
  getAllDoseLogs,
} from "../controllers/doseLog.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

// Dose Actions and Readings
router.post("/", createDoseLog);
router.put("/:logId", updateDoseLog);
router.get("/all", getAllDoseLogs);

router.get("/schedule/:scheduleId", getDoseLogsBySchedule);
router.get("/today", getTodaysDoseLogs);

// 🎯 ADDED ROUTE FOR ADHERENCE STATISTICS 🎯
router.get("/stats", getAdherenceStats);

export default router;
