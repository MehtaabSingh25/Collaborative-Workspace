import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import { createDocumentController } from "./document.controller.js";

const router = Router({ mergeParams: true });

router.post("/", protect, createDocumentController);

export default router;
