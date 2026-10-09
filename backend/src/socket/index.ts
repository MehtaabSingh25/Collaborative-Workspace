import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socket.auth.js";
import {
  registerWorkspaceHandlers,
  type AppServer,
} from "./workspace.handlers.js";
import { registerDocumentHandlers } from "./document.handlers.js";
import { registerChatHandlers } from "./chat.handlers.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket.types.js";

let io: AppServer;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id} (user ${socket.data.user.id})`);

    registerWorkspaceHandlers(socket);
    registerDocumentHandlers(socket);
    registerChatHandlers(socket);

    socket.on("disconnect", () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};
