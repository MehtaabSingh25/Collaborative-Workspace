import { Schema, model } from "mongoose";
import { IUser } from "./auth.types.js";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

  },
  {
    timestamps: true,
  }
);

const User = model<IUser>("User", userSchema);

export default User;