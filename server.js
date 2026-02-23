import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { setupWebSocket } from "./websocket/index.js";
import onlineRoute from "./routes/online.js";
import feedbackRoute from "./routes/feedback.js";

dotenv.config();

const SERVER_PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static("./public", { extensions: ["html"] }));
app.use("/online", onlineRoute);
app.use("/feedback", feedbackRoute);

const server = createServer(app);
setupWebSocket(server);

server.listen(SERVER_PORT, "0.0.0.0", () => {
  console.log(`Listening on port ${SERVER_PORT}`);
});
