const express = require("express");
const router = express.Router();
const convertTranscript = require("../services/geminiService");
const Transcript = require("../models/Transcript");

router.post("/", async (req, res) => {
  try {
    const structured = await convertTranscript(req.body.text);

    const saved = await Transcript.create({
      rawText: req.body.text,
      structuredData: structured
    });

    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
