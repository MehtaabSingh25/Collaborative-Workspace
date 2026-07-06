import { HydratedDocument } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
}

export type UserDocument = HydratedDocument<IUser>;
