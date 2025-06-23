import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { setupWebSocket } from "./websocket/index.js";
import onlineRoute from "./routes/online.js";
import feedbackRoute from "./routes/feedback.js";
dotenv.config();

const SERVER_PORT = process.env.PORT;
if (!SERVER_PORT) throw new Error("Forgot to initialize some variables");

const app = express();
const port = SERVER_PORT;

app.use(express.static("./public", { extensions: ["html"] }));
app.use("/online", onlineRoute);
app.use("/feedback", feedbackRoute);

const server = createServer(app);
setupWebSocket(server);

server.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
}); 