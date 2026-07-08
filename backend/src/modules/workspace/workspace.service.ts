import Workspace from "./workspace.model.js";
import {
  createWorkspaceSchema,
  inviteMemberSchema,
} from "./workspace.validation.js";
import WorkspaceMember, {
  WorkspaceRole,
  MembershipStatus,
} from "./workspace-member.model.js";
import AppError from "../../utils/AppError.js";
import User from "../auth/auth.model.js";

export const createWorkspace = async (body: unknown, userId: string) => {
  const data = createWorkspaceSchema.parse(body);

  const workspace = await Workspace.create({
    ...data,
    owner: userId,
  });

  await WorkspaceMember.create({
    workspace: workspace._id,
    user: userId,
    role: WorkspaceRole.OWNER,
    status: MembershipStatus.ACTIVE,
    invitedBy: userId,
    joinedAt: new Date(),
  });

  return {
    success: true,
    message: "Workspace created successfully",
    data: workspace,
  };
};

export const getMyWorkspaces = async (userId: string) => {
  const memberships = await WorkspaceMember.find({
    user: userId,
  })
    .populate({
      path: "workspace",
      populate: {
        path: "owner",
        select: "name email",
      },
    })
    .sort({
      createdAt: -1,
    });

  const workspaces = memberships.map((membership) => ({
    role: membership.role,
    workspace: membership.workspace,
  }));

  return {
    success: true,
    data: workspaces,
  };
};

export const getWorkspaceById = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
  }).populate({
    path: "workspace",
    populate: {
      path: "owner",
      select: "name email",
    },
  });

  if (!membership) {
    throw new AppError("Workspace not found", 404);
  }

  return {
    success: true,
    data: {
      role: membership.role,
      workspace: membership.workspace,
    },
  };
};

export const inviteMember = async (
  workspaceId: string,
  inviterId: string,
  body: unknown,
) => {
  const data = inviteMemberSchema.parse(body);

  const inviter = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: inviterId,
    status: MembershipStatus.ACTIVE,
  });

  if (!inviter || inviter.role !== WorkspaceRole.OWNER) {
    throw new AppError("Only the workspace owner can invite members", 403);
  }

  const user = await User.findOne({
    email: data.email,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const existingMember = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: user._id,
  });

  if (existingMember) {
    throw new AppError(
      "User is already a member or has a pending invitation",
      400,
    );
  }

  await WorkspaceMember.create({
    workspace: workspaceId,
    user: user._id,
    role: data.role as WorkspaceRole,
    status: MembershipStatus.PENDING,
    invitedBy: inviterId,
  });

  return {
    success: true,
    message: "Invitation sent successfully",
  };
};

export const acceptInvitation = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
    status: MembershipStatus.PENDING,
  });

  if (!membership) {
    throw new AppError("Invitation not found", 404);
  }

  membership.status = MembershipStatus.ACTIVE;
  membership.joinedAt = new Date();

  await membership.save();

  return {
    success: true,
    message: "Invitation accepted successfully",
  };
};

export const getPendingInvitations = async (userId: string) => {
  const invitations = await WorkspaceMember.find({
    user: userId,
    status: MembershipStatus.PENDING,
  })
    .populate({
      path: "workspace",
      select: "name description",
    })
    .populate({
      path: "invitedBy",
      select: "name email",
    })
    .sort({
      createdAt: -1,
    });

  return {
    success: true,
    data: invitations,
  };
};
