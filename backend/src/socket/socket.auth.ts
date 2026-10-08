import type { ExtendedError, Socket } from "socket.io";
import User from "../modules/auth/auth.model.js";
import { verifyAccessToken } from "../lib/jwt.js";

/**
 * Socket.IO connection middleware.
 * Reads the access token from handshake.auth.token (never from the URL),
 * verifies it with the same JWT utilities as the REST API, and attaches
 * the user to socket.data. Anything else is rejected before "connection".
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Unauthorized"));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select("name email");

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};
