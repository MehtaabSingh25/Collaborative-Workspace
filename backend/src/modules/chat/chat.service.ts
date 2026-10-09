import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import User from "../auth/auth.model.js";
import { requireWorkspaceMembership } from "../workspace/workspace.utils.js";
import ChatMessage from "./chat.model.js";
import { chatMessageSchema } from "./chat.validation.js";

export type ChatMessageDTO = {
  _id: string;
  workspaceId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
};

function serializeMessage(message: any): ChatMessageDTO {
  const sender = message.sender;
  return {
    _id: message._id.toString(),
    workspaceId: message.workspace.toString(),
    content: message.content,
    createdAt: new Date(message.createdAt).toISOString(),
    sender: { id: sender._id.toString(), name: sender.name, email: sender.email },
  };
}

export async function listChatMessages(workspaceId: string, userId: string) {
  if (!mongoose.isValidObjectId(workspaceId)) throw new AppError("Workspace not found", 404);
  await requireWorkspaceMembership(workspaceId, userId);
  const messages = await ChatMessage.find({ workspace: workspaceId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(50)
    .populate("sender", "name email");
  return { success: true, data: messages.reverse().map(serializeMessage) };
}

export async function createChatMessage(workspaceId: string, userId: string, body: unknown) {
  if (!mongoose.isValidObjectId(workspaceId)) throw new AppError("Workspace not found", 404);
  await requireWorkspaceMembership(workspaceId, userId);
  const data = chatMessageSchema.parse(body);
  const sender = await User.findById(userId).select("_id name email");
  if (!sender) throw new AppError("User not found", 404);
  const message = await ChatMessage.create({ workspace: workspaceId, sender: userId, content: data.content });
  await message.populate("sender", "name email");
  return { success: true, data: serializeMessage(message) };
}
