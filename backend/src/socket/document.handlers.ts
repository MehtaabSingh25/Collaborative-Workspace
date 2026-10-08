import type { Server, Socket } from "socket.io";
import { z, ZodError } from "zod";
import AppError from "../utils/AppError.js";
import Document from "../modules/document/document.model.js";
import { requireWorkspaceMembership } from "../modules/workspace/workspace.utils.js";
import type {
  ClientToServerEvents,
  DocumentAckResponse,
  DocumentPresenceUser,
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

const documentPayloadSchema = z.object({
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workspace id"),
  documentId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid document id"),
});

export const documentRoom = (workspaceId: string, documentId: string) =>
  `document:${workspaceId}:${documentId}`;

const toAckError = (error: unknown): DocumentAckResponse => {
  if (error instanceof ZodError) {
    return { ok: false, message: "Invalid payload" };
  }
  if (error instanceof AppError) {
    return { ok: false, message: error.message };
  }
  console.error(error);
  return { ok: false, message: "Internal Server Error" };
};

const reply = (ack: unknown, response: DocumentAckResponse) => {
  if (typeof ack === "function") ack(response);
};

const getPresence = async (
  socket: AppSocket,
  room: string,
  excludedSocketId?: string,
): Promise<DocumentPresenceUser[]> => {
  const sockets = await socket.nsp.in(room).fetchSockets();
  const users = new Map<string, DocumentPresenceUser>();

  for (const member of sockets) {
    if (member.id === excludedSocketId) continue;
    users.set(member.data.user.id, member.data.user);
  }

  return [...users.values()];
};

const broadcastPresence = async (
  socket: AppSocket,
  workspaceId: string,
  documentId: string,
  excludedSocketId?: string,
) => {
  const room = documentRoom(workspaceId, documentId);
  const users = await getPresence(socket, room, excludedSocketId);

  socket.nsp.to(room).emit("document:presence", {
    workspaceId,
    documentId,
    users,
  });
};

const authorizeDocument = async (
  workspaceId: string,
  documentId: string,
  userId: string,
) => {
  await requireWorkspaceMembership(workspaceId, userId);

  const document = await Document.findOne({
    _id: documentId,
    workspace: workspaceId,
  }).select("_id");

  if (!document) {
    throw new AppError("Document not found", 404);
  }
};

export const registerDocumentHandlers = (socket: AppSocket) => {
  socket.on("disconnecting", async () => {
    const documentRooms = [...socket.rooms].filter((room) =>
      room.startsWith("document:"),
    );

    await Promise.all(
      documentRooms.map(async (room) => {
        const [, workspaceId, documentId] = room.split(":");
        await broadcastPresence(
          socket,
          workspaceId,
          documentId,
          socket.id,
        );
      }),
    );
  });

  socket.on("document:join", async (payload, ack) => {
    try {
      const { workspaceId, documentId } = documentPayloadSchema.parse(payload);

      await authorizeDocument(workspaceId, documentId, socket.data.user.id);

      await socket.join(documentRoom(workspaceId, documentId));
      await broadcastPresence(socket, workspaceId, documentId);

      reply(ack, { ok: true, workspaceId, documentId });
    } catch (error) {
      reply(ack, toAckError(error));
    }
  });

  socket.on("document:leave", async (payload, ack) => {
    try {
      const { workspaceId, documentId } = documentPayloadSchema.parse(payload);
      const room = documentRoom(workspaceId, documentId);

      await socket.leave(room);
      await broadcastPresence(socket, workspaceId, documentId);

      reply(ack, { ok: true, workspaceId, documentId });
    } catch (error) {
      reply(ack, toAckError(error));
    }
  });
};
