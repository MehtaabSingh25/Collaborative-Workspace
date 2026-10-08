import type { Server, Socket } from "socket.io";
import { z, ZodError } from "zod";
import AppError from "../utils/AppError.js";
import { requireWorkspaceMembership } from "../modules/workspace/workspace.utils.js";
import type {
  AckResponse,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types.js";

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const workspacePayloadSchema = z.object({
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workspace id"),
});

export const workspaceRoom = (workspaceId: string) =>
  `workspace:${workspaceId}`;

const toAckError = (error: unknown): AckResponse => {
  if (error instanceof ZodError) {
    return { ok: false, message: "Invalid payload" };
  }
  if (error instanceof AppError) {
    return { ok: false, message: error.message };
  }
  console.error(error);
  return { ok: false, message: "Internal Server Error" };
};

const reply = (ack: unknown, response: AckResponse) => {
  if (typeof ack === "function") ack(response);
};

export const registerWorkspaceHandlers = (socket: AppSocket) => {
  socket.on("workspace:join", async (payload, ack) => {
    try {
      const { workspaceId } = workspacePayloadSchema.parse(payload);

      // Server-side authorization: ACTIVE membership only.
      // Non-members and PENDING invitees get a 404 AppError.
      await requireWorkspaceMembership(workspaceId, socket.data.user.id);

      await socket.join(workspaceRoom(workspaceId));
      reply(ack, { ok: true, workspaceId });
    } catch (error) {
      reply(ack, toAckError(error));
    }
  });

  socket.on("workspace:leave", async (payload, ack) => {
    try {
      const { workspaceId } = workspacePayloadSchema.parse(payload);
      await socket.leave(workspaceRoom(workspaceId));
      reply(ack, { ok: true, workspaceId });
    } catch (error) {
      reply(ack, toAckError(error));
    }
  });
};
