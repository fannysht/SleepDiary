import express from "express";
import * as sleepController from "../controllers/sleep.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware.verifyToken);

router.get("/status", sleepController.getCurrentStatus);
router.put("/status", sleepController.updateStatus);

router.get("/", sleepController.getEntries);
router.post("/", sleepController.createEntry);

router.get("/date/:date", sleepController.getEntryByDate);
router.get("/:id", sleepController.getEntryById);
router.put("/:id", sleepController.updateEntry);
router.delete("/:id", sleepController.deleteEntry);

export default router;