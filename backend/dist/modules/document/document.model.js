import { Schema, model } from "mongoose";
const documentSchema = new Schema({
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
    version: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});
const Document = model("Document", documentSchema);
export default Document;
