// routes/job.routes.js
import express from "express";
import * as statsController from "../controllers/stats.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware.verifyToken);

router.get("/", statsController.getStats);
router.get("/garmin-stats", statsController.getGarminStats);

export default router;