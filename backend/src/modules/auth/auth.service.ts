import bcrypt from "bcrypt";
import User from "./auth.model.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import AppError from "../../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";

const registerUser = async (body: unknown) => {
  const data = registerSchema.parse(body);

  const existingUser = await User.findOne({
    email: data.email,
  });

  if (existingUser) {
    throw new AppError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return {
    success: true,
    message: "User registered successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

const loginUser = async (body: unknown) => {
  const data = loginSchema.parse(body);

  const user = await User.findOne({
    email: data.email,
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(data.password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
  });

  return {
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    },
  };
};

const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    success: true,
    data: user,
  };
};

const logoutUser = async () => {
  return {
    success: true,
    message: "Logged out successfully",
  };
};

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("Refresh token missing", 401);
  }

  const payload = verifyRefreshToken(refreshToken);

  const user = await User.findById(payload.userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
  });

  return {
    success: true,
    message: "Access token refreshed",
    data: {
      accessToken,
    },
  };
};

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
};
