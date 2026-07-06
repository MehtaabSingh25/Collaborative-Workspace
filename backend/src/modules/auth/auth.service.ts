import bcrypt from "bcrypt";
import User from "./auth.model.js";
import { registerSchema } from "./auth.validation.js";
import AppError from "../../utils/AppError.js";

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

export { registerUser };