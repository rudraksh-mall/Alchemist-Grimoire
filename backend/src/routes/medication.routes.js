import { Router } from "express";
import {
  createMedicationSchedule,
  getMedicationSchedules,
  getMedicationScheduleById,
  updateMedicationSchedule,
  deleteMedicationSchedule,
} from "../controllers/medication.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

// Base routes (POST/GET /v1/medications)
router.post("/", createMedicationSchedule);
router.get("/", getMedicationSchedules);

// Routes for specific schedules (using ID parameter)
router.route("/:scheduleId")
    .get(getMedicationScheduleById)
    // 🎯 FIX: Listen for PUT requests (used by frontend updateMedicine)
    .put(updateMedicationSchedule) 
    // We keep PATCH for consistency/API design
    .patch(updateMedicationSchedule)
    .delete(deleteMedicationSchedule); 

export default router;
