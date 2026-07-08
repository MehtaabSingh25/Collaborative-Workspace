import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import {
  createDocumentController,
  getDocumentByIdController,
  getWorkspaceDocumentsController,
} from "./document.controller.js";

const router = Router({ mergeParams: true });

router.post("/", protect, createDocumentController);

router.get("/", protect, getWorkspaceDocumentsController);

router.get("/:documentId", protect, getDocumentByIdController);

export default router;
