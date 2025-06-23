import express from "express";
import db from "../db/sqlite.js";
const router = express.Router();

router.post("/", express.json(), async (req, res) => {
  await db.insertFeedback({ feedback: req.body.feedback });
  res.sendStatus(200);
});

export default router; 