import express from "express";
const router = express.Router();

// This will be replaced by actual logic in server.js
router.get("/", (req, res) => {
  res.send({ online: 0 });
});

export default router; 