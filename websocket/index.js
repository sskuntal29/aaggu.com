import { WebSocketServer } from "ws";
import "./prototypes.js";
import { handleWebSocketConnection } from "./matchmaking.js";

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });
  wss.textUserInterestMap = new Map();
  wss.textInterestUserMap = new Map();
  wss.videoUserInterestMap = new Map();
  wss.videoInterestUserMap = new Map();
  wss.on("connection", (ws, req) => handleWebSocketConnection(wss, ws, req));
} 