const express = require("express");
const router = express.Router();
const scheduleMeeting = require("../services/scheduler");
const Meeting = require("../models/Meeting");
const emailService = require("../services/emailService");
const socketService = require("../services/socket");

// Create meeting
router.post("/", async (req, res) => {
  try {
    const { title, organizerId, participants, startTime, endTime, reminders } = req.body;
    const { meeting, inviteResults } = await scheduleMeeting({ title, organizerId, participants, startTime, endTime, reminders });
    // Emit socket event
    try { socketService.getIO().emit("meeting:created", meeting); } catch (e) {}
    res.status(201).json({ meeting, inviteResults });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List
router.get("/", async (req, res) => {
  try {
    const meetings = await Meeting.find().populate("organizer participants.user");
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detail
router.get("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate("organizer participants.user");
    if (!meeting) return res.status(404).json({ error: "Not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: "Not found" });

    const updates = req.body;
    Object.assign(meeting, updates);
    await meeting.save();

    // Notify participants of update
    for (const p of meeting.participants) {
      if (p.email) emailService.sendUpdateEmail(meeting, p.email).catch((e) => console.error("Update email failed", e));
    }

    try { socketService.getIO().emit("meeting:updated", meeting); } catch (e) {}

    res.json(meeting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Participant respond (accept/decline) via POST body
router.post("/:id/respond", async (req, res) => {
  try {
    const { email, userId, status } = req.body; // status = 'accepted' | 'declined'
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: "Not found" });

    const participant = meeting.participants.find((p) => (userId && String(p.user) === String(userId)) || (email && p.email === email));
    if (!participant) return res.status(404).json({ error: "Participant not found" });

    participant.status = status;
    participant.respondedAt = new Date();
    await meeting.save();

    // send confirmation
    if (participant.email) emailService.sendResponseConfirmation(meeting, participant.email, status).catch((e) => console.error("Confirmation email failed", e));

    try { socketService.getIO().emit("meeting:response", { meetingId: meeting._id, participant }); } catch (e) {}

    res.json({ success: true, participant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Participant respond (accept/decline) via email link (GET)
router.get("/:id/respond", async (req, res) => {
  try {
    const { action, email } = req.query; // action = 'accepted' | 'declined'
    if (!action || !email) return res.status(400).send("Missing action or email");

    const status = action === "accepted" ? "accepted" : action === "declined" ? "declined" : null;
    if (!status) return res.status(400).send("Invalid action");

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).send("Meeting not found");

    const participant = meeting.participants.find((p) => p.email === email);
    if (!participant) return res.status(404).send("Participant not found");

    participant.status = status;
    participant.respondedAt = new Date();
    await meeting.save();

    // send confirmation
    if (participant.email) emailService.sendResponseConfirmation(meeting, participant.email, status).catch((e) => console.error("Confirmation email failed", e));

    // Redirect user to a simple confirmation page or send a small message
    const base = process.env.FRONTEND_URL || (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`);
    return res.send(`<html><body><p>Your response (${status}) has been recorded for meeting "${meeting.title}".</p><p><a href="${base}">Open app</a></p></body></html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Manual notify (for testing)
router.post("/:id/notify", async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: "Not found" });

    for (const p of meeting.participants) {
      if (p.email) emailService.sendReminderEmail(meeting, p.email).catch((e) => console.error("Reminder failed", e));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
