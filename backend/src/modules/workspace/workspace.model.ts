import { Schema, model, Types } from "mongoose";

export interface IWorkspace {
  name: string;
  description?: string;
  owner: Types.ObjectId;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Workspace = model<IWorkspace>("Workspace", workspaceSchema);

export default Workspace;
