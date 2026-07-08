import AppError from "../../utils/AppError.js";
import WorkspaceMember, {
  MembershipStatus,
} from "../workspace/workspace-member.model.js";
import Document from "./document.model.js";
import { createDocumentSchema } from "./document.validation.js";

export const createDocument = async (
  workspaceId: string,
  userId: string,
  body: unknown,
) => {
  const data = createDocumentSchema.parse(body);

  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
    status: MembershipStatus.ACTIVE,
  });

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

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
