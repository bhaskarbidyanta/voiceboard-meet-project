const express = require("express");
const router = express.Router();
const scheduleMeeting = require("../services/scheduler");

router.post("/schedule", async (req, res) => {
  try {
    const meeting = await scheduleMeeting(
      req.body.employeeId,
      req.body.managerId,
      req.body.startTime
    );
    res.json(meeting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
