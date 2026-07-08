import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import errorMiddleware from "./middleware/error.middleware.js";
import protect from "./middleware/auth.middleware.js";
import workspaceRoutes from "./modules/workspace/workspace.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully 🚀",
  });
});

app.use("/api", routes);
app.use(errorMiddleware);
app.get("/api/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

app.use("/api/workspaces", workspaceRoutes);

export default app;
