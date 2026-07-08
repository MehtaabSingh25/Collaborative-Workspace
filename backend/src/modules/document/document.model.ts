import { Schema, model, Types } from "mongoose";

export interface IDocument {
  title: string;
  content: string;
  workspace: Types.ObjectId;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      default: "",
    },

    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Document = model<IDocument>("Document", documentSchema);

export default Document;
