const express = require("express");
const router = express.Router();
const User = require("../models/User");

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Create user (prevents duplicates)
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const existing = await User.findOne({ email: new RegExp(`^${escapeRegExp(email.trim())}$`, "i") });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const officeEmail = req.body.officeEmail ? req.body.officeEmail.trim().toLowerCase() : undefined;
    const user = await User.create({ ...req.body, email: email.trim().toLowerCase(), officeEmail });

    // send welcome email (best-effort)
    try {
      const emailService = require("../services/emailService");
      emailService.sendWelcomeEmail(user).catch((e) => console.error("Welcome email failed", e));
    } catch (e) {
      console.error("Email service not available", e);
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get users or lookup by email (case-insensitive)
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    console.log("GET /users called with query=", req.query);
    if (email) {
      const user = await User.findOne({ email: new RegExp(`^${escapeRegExp(email.trim())}$`, "i") });
      console.log("Lookup result for", email, "->", !!user);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    }

    const users = await User.find();
    console.log("Returning users list count=", users.length);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Temporary debug endpoint: DB inspection
router.get("/debug/all", async (req, res) => {
  try {
    const count = await User.countDocuments();
    const sample = await User.find().limit(50).lean();
    res.json({ count, sample });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify user (admin or automated flow)
router.post("/:id/verify", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.verified = true;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;   // THIS LINE IS CRITICAL
