import AppError from "../../utils/AppError.js";
import {
  requireWorkspaceMembership,
  requireWorkspaceRole,
} from "../workspace/workspace.utils.js";

import Document from "./document.model.js";
import DocumentRevision from "./document-revision.model.js";
import {
  createDocumentSchema,
  updateDocumentSchema,
  restoreDocumentSchema,
} from "./document.validation.js";
import { WorkspaceRole } from "../workspace/workspace-member.model.js";
import mongoose from "mongoose";

export const createDocument = async (
  workspaceId: string,
  userId: string,
  body: unknown,
) => {
  const data = createDocumentSchema.parse(body);

  await requireWorkspaceRole(workspaceId, userId, [
    WorkspaceRole.OWNER,
    WorkspaceRole.EDITOR,
  ]);

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

const createDocumentRevision = async (document: {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  version: number;
  title: string;
  content: string;
  lastEditedBy: mongoose.Types.ObjectId;
}) => {
  await DocumentRevision.create({
    document: document._id,
    workspace: document.workspace,
    version: document.version,
    title: document.title,
    content: document.content,
    editedBy: document.lastEditedBy,
  });
};

export const updateDocument = async (
  workspaceId: string,
  documentId: string,
  userId: string,
  body: unknown,
) => {
  const data = updateDocumentSchema.parse(body);

  await requireWorkspaceRole(workspaceId, userId, [
    WorkspaceRole.OWNER,
    WorkspaceRole.EDITOR,
  ]);

  if (data.expectedVersion !== undefined) {
    const $set: Record<string, unknown> = {
      lastEditedBy: new mongoose.Types.ObjectId(userId),
    };

    if (data.title !== undefined) {
      $set.title = data.title;
    }

    if (data.content !== undefined) {
      $set.content = data.content;
    }

    const document = await Document.findOneAndUpdate(
      {
        _id: documentId,
        workspace: workspaceId,
        version: data.expectedVersion,
      },
      { $set, $inc: { version: 1 } },
      { new: true, runValidators: true },
    );

    if (!document) {
      const existing = await Document.findOne({
        _id: documentId,
        workspace: workspaceId,
      }).select("version");

      if (!existing) {
        throw new AppError("Document not found", 404);
      }

      throw new AppError("Document version conflict", 409);
    }

    await createDocumentRevision(document);

    return {
      success: true,
      message: "Document updated successfully",
      data: document,
    };
  }

  const document = await Document.findOne({
    _id: documentId,
    workspace: workspaceId,
  });

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  if (data.title !== undefined) {
    document.title = data.title;
  }

  if (data.content !== undefined) {
    document.content = data.content;
  }

  document.lastEditedBy = new mongoose.Types.ObjectId(userId);
  document.version += 1;

  await document.save();
  await createDocumentRevision(document);

  return {
    success: true,
    message: "Document updated successfully",
    data: document,
  };
};

export const getDocumentHistory = async (
  workspaceId: string,
  documentId: string,
  userId: string,
) => {
  await requireWorkspaceMembership(workspaceId, userId);

  const document = await Document.findOne({
    _id: documentId,
    workspace: workspaceId,
  }).select("_id");

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  const revisions = await DocumentRevision.find({
    document: documentId,
    workspace: workspaceId,
  })
    .populate("editedBy", "name email")
    .sort({ version: -1 });

  return {
    success: true,
    data: revisions,
  };
};

export const restoreDocument = async (
  workspaceId: string,
  documentId: string,
  userId: string,
  body: unknown,
) => {
  const data = restoreDocumentSchema.parse(body);

  await requireWorkspaceRole(workspaceId, userId, [
    WorkspaceRole.OWNER,
    WorkspaceRole.EDITOR,
  ]);

  const revision = await DocumentRevision.findOne({
    _id: { $exists: true },
    document: documentId,
    workspace: workspaceId,
    version: data.version,
  });

  if (!revision) {
    throw new AppError("Document revision not found", 404);
  }

  const document = await Document.findOneAndUpdate(
    {
      _id: documentId,
      workspace: workspaceId,
      version: data.expectedVersion,
    },
    {
      $set: {
        title: revision.title,
        content: revision.content,
        lastEditedBy: new mongoose.Types.ObjectId(userId),
      },
      $inc: { version: 1 },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!document) {
    const existing = await Document.findOne({
      _id: documentId,
      workspace: workspaceId,
    }).select("version");

    if (!existing) {
      throw new AppError("Document not found", 404);
    }

    throw new AppError("Document version conflict", 409);
  }

  await createDocumentRevision(document);

  return {
    success: true,
    message: "Document restored successfully",
    data: document,
  };
};

