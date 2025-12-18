const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  title: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      status: { type: String, enum: ["invited", "accepted", "declined"], default: "invited" },
      respondedAt: Date
    }
  ],
  startTime: Date,
  endTime: Date,
  reminders: [Number], // minutes before
  remindersSent: [Number],
  status: { type: String, enum: ["scheduled", "cancelled", "completed"], default: "scheduled" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Meeting", MeetingSchema);