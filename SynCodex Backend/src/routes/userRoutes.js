import express from "express";
import { changePassword, changeName, changeEmail, deleteAccount } from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/change-password", verifyToken, changePassword);
router.patch("/change-name", verifyToken, changeName);
router.patch("/change-email", verifyToken, changeEmail);
router.delete("/delete-account", verifyToken, deleteAccount);

export default router;
