// routes/auth.routes.js
import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

// Routes publiques
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-code", authController.verifyCode);
router.post("/forgot-password", authController.forgotPassword);
router.post("/password", authController.updatePassword);

// Routes protégées
router.get("/verify", authMiddleware.verifyToken, authController.verifyToken);
router.get("/me", authMiddleware.verifyToken, authController.getMe);
router.post("/logout", authMiddleware.verifyToken, authController.logout);

export default router;