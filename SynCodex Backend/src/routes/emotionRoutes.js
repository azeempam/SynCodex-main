import { Router } from "express";
import { inferEmotion } from "../controllers/emotionController.js";

const router = Router();

router.post("/infer", inferEmotion);

export default router;
