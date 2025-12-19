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

  // Build participant docs with emails. If userId is not provided but an email is, try to link to an existing user by email.
  const participantDocs = await Promise.all(
    participants.map(async (p) => {
      let user = null;
      if (p.userId) {
        user = await User.findById(p.userId);
      } else if (p.email) {
        // attempt to find user by email or officeEmail (case-insensitive)
        user = await User.findOne({ $or: [{ email: new RegExp(`^${p.email}$`, 'i') }, { officeEmail: new RegExp(`^${p.email}$`, 'i') }] });
      }

      return {
        user: user ? user._id : undefined,
        email: p.email || (user && (user.officeEmail || user.email)),
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

  // Send invite emails to any participant with an email (allow unverified users), and collect invite results
  const inviteResults = [];
  for (const p of participantDocs) {
    const result = { email: p.email, user: p.user || null, invited: false };
    if (!p.email) {
      result.reason = "no_email";
    } else {
      try {
        await emailService.sendInviteEmail(meeting, p.email);
        result.invited = true;
        if (p.user) {
          const user = await User.findById(p.user);
          if (!user) result.note = 'user_not_found_but_invited';
          else result.note = user.verified ? 'invited_verified_user' : 'invited_unverified_user';
          result.userVerified = !!(user && user.verified);
        } else {
          result.note = 'invited_by_email_no_user';
        }
      } catch (e) {
        console.error("Invite send failed", e);
        result.reason = "send_failed";
      }
    }
    inviteResults.push(result);
  }

  // Log results for diagnostics
  try { console.log('Invite results for meeting', meeting._id.toString(), inviteResults); } catch(e){}

  // Notify the organizer (confirmation email)
  try {
    if (organizerId) {
      const org = await User.findById(organizerId);
      if (org && org.email) {
        emailService.sendUpdateEmail(meeting, org.email).catch((e) => console.error('Organizer notification failed', e));
      }
    }
  } catch (e) {
    console.error('Failed to notify organizer', e);
  }

  return { meeting, inviteResults };
}

module.exports = scheduleMeeting;