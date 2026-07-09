import http from "http";
import app from "./app.js";
import { initializeSocket } from "./socket/index.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";

await connectDB();

const server = http.createServer(app);

initializeSocket(server);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
