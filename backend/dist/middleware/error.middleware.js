import { ZodError } from "zod";
import AppError from "../utils/AppError.js";
const errorMiddleware = (error, req, res, next) => {
    // Zod validation failures -> 400 with per-field details.
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }
    // Malformed JSON body (thrown by express.json()).
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body",
        });
    }
    // Invalid ObjectId in a URL param or query.
    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid identifier",
        });
    }
    // Duplicate key from a unique index.
    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Resource already exists",
        });
    }
    // If the error was created using AppError, preserve its status code.
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }
    // Fallback for unexpected errors.
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};
export default errorMiddleware;
