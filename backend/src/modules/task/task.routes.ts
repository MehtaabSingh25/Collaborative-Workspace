import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import { createTaskController, deleteTaskController, listTasksController, updateTaskController } from "./task.controller.js";

const router = Router({ mergeParams: true });
router.get("/", protect, listTasksController);
router.post("/", protect, createTaskController);
router.patch("/:taskId", protect, updateTaskController);
router.delete("/:taskId", protect, deleteTaskController);
export default router;
