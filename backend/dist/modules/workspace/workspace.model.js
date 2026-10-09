import { Schema, model } from "mongoose";
const workspaceSchema = new Schema({
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
}, {
    timestamps: true,
});
const Workspace = model("Workspace", workspaceSchema);
export default Workspace;
