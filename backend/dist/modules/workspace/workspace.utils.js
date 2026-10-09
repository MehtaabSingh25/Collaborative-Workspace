import AppError from "../../utils/AppError.js";
import WorkspaceMember, { MembershipStatus, } from "./workspace-member.model.js";
export const requireWorkspaceMembership = async (workspaceId, userId) => {
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
export const requireWorkspaceRole = async (workspaceId, userId, allowedRoles) => {
    const membership = await requireWorkspaceMembership(workspaceId, userId);
    if (!allowedRoles.includes(membership.role)) {
        throw new AppError("Forbidden", 403);
    }
    return membership;
};
