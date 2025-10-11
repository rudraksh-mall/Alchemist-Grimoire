import { Router } from "express";
import {
  createDoseLog,
  updateDoseLog,
  getDoseLogsBySchedule,
  getTodaysDoseLogs,
  getAdherenceStats,
  getAllDoseLogs,
  getAdherencePrediction,
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

router.get("/stats", getAdherenceStats);

router.get("/predict", getAdherencePrediction);

export default router;