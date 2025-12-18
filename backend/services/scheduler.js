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

  // Send invite emails only to verified users, and collect invite results
  const inviteResults = [];
  for (const p of participantDocs) {
    const result = { email: p.email, user: p.user || null, invited: false };
    if (!p.email) {
      result.reason = "no_email";
    } else if (p.user) {
      const user = await User.findById(p.user);
      if (!user) {
        result.reason = "user_not_found";
      } else if (!user.verified) {
        result.reason = "user_not_verified";
      } else {
        try {
          await emailService.sendInviteEmail(meeting, p.email);
          result.invited = true;
        } catch (e) {
          console.error("Invite send failed", e);
          result.reason = "send_failed";
        }
      }
    } else {
      // There's an email but no user record — do not send (policy: only verified users)
      result.reason = "no_user_record";
    }
    inviteResults.push(result);
  }

  return { meeting, inviteResults };
}

module.exports = scheduleMeeting;