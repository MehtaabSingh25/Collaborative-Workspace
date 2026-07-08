import { Schema, model, Types } from "mongoose";

export enum WorkspaceRole {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}

export enum MembershipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
}

export interface IWorkspaceMember {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  invitedBy: Types.ObjectId;
  joinedAt?: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(WorkspaceRole),
      default: WorkspaceRole.VIEWER,
    },

    status: {
      type: String,
      enum: Object.values(MembershipStatus),
      default: MembershipStatus.PENDING,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

const WorkspaceMember = model<IWorkspaceMember>(
  "WorkspaceMember",
  workspaceMemberSchema,
);

export default WorkspaceMember;
