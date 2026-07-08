import AppError from "../../utils/AppError.js";
import { requireWorkspaceMembership } from "../workspace/workspace.utils.js";
import Document from "./document.model.js";
import { createDocumentSchema } from "./document.validation.js";

export const createDocument = async (
  workspaceId: string,
  userId: string,
  body: unknown,
) => {
  const data = createDocumentSchema.parse(body);

  await requireWorkspaceMembership(workspaceId, userId);

  const document = await Document.create({
    title: data.title,
    content: data.content ?? "",
    workspace: workspaceId,
    createdBy: userId,
    lastEditedBy: userId,
  });

  return {
    success: true,
    message: "Document created successfully",
    data: document,
  };
};

export const getWorkspaceDocuments = async (
  workspaceId: string,
  userId: string,
) => {
  await requireWorkspaceMembership(workspaceId, userId);

  const documents = await Document.find({
    workspace: workspaceId,
  })
    .select("-content")
    .populate("createdBy", "name email")
    .populate("lastEditedBy", "name email")
    .sort({
      updatedAt: -1,
    });

  return {
    success: true,
    data: documents,
  };
};

export const getDocumentById = async (
  workspaceId: string,
  documentId: string,
  userId: string,
) => {
  await requireWorkspaceMembership(workspaceId, userId);

  const document = await Document.findOne({
    _id: documentId,
    workspace: workspaceId,
  })
    .populate("createdBy", "name email")
    .populate("lastEditedBy", "name email");

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  return {
    success: true,
    data: document,
  };
};
