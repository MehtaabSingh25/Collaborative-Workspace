import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { registerUser } from "./auth.service.js";

const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);

  res.status(201).json(result);
});

export { register };