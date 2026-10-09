import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socket.auth.js";
import { registerWorkspaceHandlers, } from "./workspace.handlers.js";
import { registerDocumentHandlers } from "./document.handlers.js";
let io;
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
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
