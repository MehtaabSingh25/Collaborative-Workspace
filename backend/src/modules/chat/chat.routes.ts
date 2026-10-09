import { Router } from "express";
import protect from "../../middleware/auth.middleware.js";
import { listChatMessagesController } from "./chat.controller.js";

const router = Router({ mergeParams: true });
router.get("/messages", protect, listChatMessagesController);
export default router;
