import asyncHandler from "../../utils/asyncHandler.js";
import { createDocument, getWorkspaceDocuments, getDocumentById, updateDocument, getDocumentHistory, restoreDocument, } from "./document.service.js";
export const createDocumentController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const result = await createDocument(workspaceId, req.user.id, req.body);
    res.status(201).json(result);
});
export const getWorkspaceDocumentsController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const result = await getWorkspaceDocuments(workspaceId, req.user.id);
    res.status(200).json(result);
});
export const getDocumentByIdController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;
    const result = await getDocumentById(workspaceId, documentId, req.user.id);
    res.status(200).json(result);
});
export const updateDocumentController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;
    const result = await updateDocument(workspaceId, documentId, req.user.id, req.body);
    res.status(200).json(result);
});
export const getDocumentHistoryController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;
    const result = await getDocumentHistory(workspaceId, documentId, req.user.id);
    res.status(200).json(result);
});
export const restoreDocumentController = asyncHandler(async (req, res) => {
    const workspaceId = Array.isArray(req.params.workspaceId)
        ? req.params.workspaceId[0]
        : req.params.workspaceId;
    const documentId = Array.isArray(req.params.documentId)
        ? req.params.documentId[0]
        : req.params.documentId;
    const result = await restoreDocument(workspaceId, documentId, req.user.id, req.body);
    res.status(200).json(result);
});
