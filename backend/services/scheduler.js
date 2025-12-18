const Meeting = require("../models/Meeting");
const User = require("../models/User");
const emailService = require("./emailService");

// payload: { title, organizerId, participants: [{ userId, email }], startTime, endTime, reminders }
async function scheduleMeeting({ title, organizerId, participants = [], startTime, endTime, reminders = [60] }) {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 30 * 60000);

  const participantIds = participants.map((p) => p.userId).filter(Boolean);

  const conflict = await Meeting.findOne({
    $or: [{ "participants.user": { $in: participantIds } }, { organizer: { $in: participantIds } }],
    startTime: { $lt: end },
    endTime: { $gt: start }
  });

  if (conflict) {
    throw new Error("Time slot conflict");
  }

  // Build participant docs with emails
  const participantDocs = await Promise.all(
    participants.map(async (p) => {
      let user = null;
      if (p.userId) user = await User.findById(p.userId);
      return {
        user: p.userId || undefined,
        email: p.email || (user && user.email),
        status: "invited"
      };
    })
  );

  const meeting = await Meeting.create({
    title,
    organizer: organizerId,
    participants: participantDocs,
    startTime: start,
    endTime: end,
    reminders,
    remindersSent: []
  });

  // Send invite emails
  for (const p of participantDocs) {
    if (p.email) {
      emailService.sendInviteEmail(meeting, p.email).catch((e) => console.error("Invite send failed", e));
    }
  }

  return meeting;
}

module.exports = scheduleMeeting;