import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/ask").post(sendMessage);

export default router;
