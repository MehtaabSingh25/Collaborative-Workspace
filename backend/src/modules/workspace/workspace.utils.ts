import AppError from "../../utils/AppError.js";
import WorkspaceMember, { MembershipStatus } from "./workspace-member.model.js";

export const requireWorkspaceMembership = async (
  workspaceId: string,
  userId: string,
) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
    status: MembershipStatus.ACTIVE,
  });

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  return membership;
};
