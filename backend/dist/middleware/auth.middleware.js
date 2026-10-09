import User from "../modules/auth/auth.model.js";
import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../lib/jwt.js";
const protect = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Unauthorized", 401));
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.userId).select("-password");
        if (!user) {
            return next(new AppError("User not found", 404));
        }
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        };
        next();
    }
    catch {
        return next(new AppError("Invalid or expired token", 401));
    }
};
export default protect;
