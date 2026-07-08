import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError.js";

const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If the error was created using AppError, preserve its status code.
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Fallback for unexpected errors.
  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorMiddleware;
