import jwt from "jsonwebtoken";
import env from "../config/env.js";

interface TokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
};