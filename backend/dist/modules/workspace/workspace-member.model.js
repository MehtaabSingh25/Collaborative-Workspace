import { Schema, model } from "mongoose";
export var WorkspaceRole;
(function (WorkspaceRole) {
    WorkspaceRole["OWNER"] = "OWNER";
    WorkspaceRole["EDITOR"] = "EDITOR";
    WorkspaceRole["VIEWER"] = "VIEWER";
})(WorkspaceRole || (WorkspaceRole = {}));
export var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["PENDING"] = "PENDING";
    MembershipStatus["ACTIVE"] = "ACTIVE";
})(MembershipStatus || (MembershipStatus = {}));
const workspaceMemberSchema = new Schema({
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
}, {
    timestamps: true,
});
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });
const WorkspaceMember = model("WorkspaceMember", workspaceMemberSchema);
export default WorkspaceMember;
