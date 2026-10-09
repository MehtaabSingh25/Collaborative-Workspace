import asyncHandler from "../../utils/asyncHandler.js";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, } from "./auth.service.js";
const register = asyncHandler(async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json(result);
});
const login = asyncHandler(async (req, res) => {
    const result = await loginUser(req.body);
    res.cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            user: result.data.user,
            accessToken: result.data.accessToken,
        },
    });
});
const getMe = asyncHandler(async (req, res) => {
    const result = await getCurrentUser(req.user.id);
    res.status(200).json(result);
});
const logout = asyncHandler(async (_req, res) => {
    await logoutUser();
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    const result = await refreshAccessToken(token);
    res.status(200).json(result);
});
export { register, login, refreshToken, logout, getMe };
