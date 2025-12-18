const express = require("express");
const router = express.Router();
const convertTranscript = require("../services/geminiService");
const Transcript = require("../models/Transcript");

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Transcript text is required" });
    }

    let structured;
    try {
      structured = await convertTranscript(text);
    } catch (convErr) {
      console.error("Transcript conversion failed:", convErr);
      // Fallback so we can still save the raw transcript while debugging the conversion
      structured = { error: "conversion_failed", message: convErr.message || String(convErr) };
    }

    const saved = await Transcript.create({
      rawText: text,
      structuredData: structured
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving transcript:", err);
    const response = { error: err.message };
    if (process.env.NODE_ENV !== "production") response.stack = err.stack;
    res.status(500).json(response);
  }
});

module.exports = router;
