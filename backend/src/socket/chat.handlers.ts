import type { Socket } from "socket.io";
import { z, ZodError } from "zod";
import AppError from "../utils/AppError.js";
import { createChatMessage } from "../modules/chat/chat.service.js";
import { requireWorkspaceMembership } from "../modules/workspace/workspace.utils.js";
import type { ChatAckResponse, ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./socket.types.js";
import { workspaceRoom } from "./workspace.handlers.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
const payloadSchema = z.object({ workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workspace id"), content: z.string().trim().min(1).max(2000) });

function reply(ack: unknown, response: ChatAckResponse) {
  if (typeof ack === "function") ack(response);
}

export const registerChatHandlers = (socket: AppSocket) => {
  socket.on("chat:send", async (payload, ack) => {
    try {
      const parsed = payloadSchema.parse(payload);
      const room = workspaceRoom(parsed.workspaceId);
      if (!socket.rooms.has(room)) throw new AppError("Join workspace first", 403);
      await requireWorkspaceMembership(parsed.workspaceId, socket.data.user.id);
      const result = await createChatMessage(parsed.workspaceId, socket.data.user.id, { content: parsed.content });
      socket.nsp.to(room).emit("chat:message", result.data);
      reply(ack, { ok: true, message: result.data });
    } catch (error) {
      if (error instanceof ZodError) { reply(ack, { ok: false, message: "Invalid payload" }); return; }
      if (error instanceof AppError) { reply(ack, { ok: false, message: error.message }); return; }
      console.error(error);
      reply(ack, { ok: false, message: "Internal Server Error" });
    }
  });
};
