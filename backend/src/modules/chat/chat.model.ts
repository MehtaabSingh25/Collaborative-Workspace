import { Schema, model, Types } from "mongoose";

export interface IChatMessage {
  workspace: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  },
  { timestamps: true },
);

chatMessageSchema.index({ workspace: 1, createdAt: -1 });

const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);
export default ChatMessage;
