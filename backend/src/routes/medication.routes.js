import { Router } from "express";
import {
    createMedicationSchedule, 
    getMedicationSchedules, 
    getMedicationScheduleById, 
    updateMedicationSchedule, 
    deleteMedicationSchedule
} from "../controllers/medication.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.post("/create", createMedicationSchedule);
router.get("/", getMedicationSchedules);
router.get("/:scheduleId", getMedicationScheduleById);
router.patch("/:scheduleId", updateMedicationSchedule);
router.delete("/:scheduleId", deleteMedicationSchedule);

export default router;