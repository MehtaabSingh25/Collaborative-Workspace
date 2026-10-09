import { Schema, model } from "mongoose";
const documentRevisionSchema = new Schema({
    document: {
        type: Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true,
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
    },
    version: {
        type: Number,
        required: true,
        min: 1,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    content: {
        type: String,
        required: true,
    },
    editedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
documentRevisionSchema.index({ document: 1, version: -1 }, { unique: true });
const DocumentRevision = model("DocumentRevision", documentRevisionSchema);
export default DocumentRevision;
