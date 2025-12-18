const Meeting = require("../models/Meeting");
const emailService = require("./emailService");

function minutesUntil(date){
  return Math.round((date - new Date()) / 60000);
}

async function scanAndSendReminders(){
  const now = new Date();
  // Load meetings starting in next 7 days
  const upcoming = await Meeting.find({ status: "scheduled", startTime: { $gt: now } });

  for (const meeting of upcoming) {
    const mins = minutesUntil(meeting.startTime);
    const reminders = meeting.reminders || [];
    for (const r of reminders) {
      if ((meeting.remindersSent || []).includes(r)) continue;

      // If we are within the minute that should trigger the reminder
      if (mins <= r && mins > r - 1) {
        for (const p of meeting.participants) {
          if (p.email && p.status !== "declined") {
            try {
              await emailService.sendReminderEmail(meeting, p.email);
              console.log(`Sent reminder ${r}min for meeting ${meeting._id} to ${p.email}`);
            } catch (e) {
              console.error("Failed to send reminder", e);
            }
          }
        }
        meeting.remindersSent = Array.from(new Set([...(meeting.remindersSent || []), r]));
        await meeting.save();
      }
    }
  }
}

function startReminderService(intervalMs = 60 * 1000) {
  console.log("Starting reminder service (intervalMs=", intervalMs, ")");
  // Run immediately and then every interval
  scanAndSendReminders().catch((e) => console.error("Reminder scan failed", e));
  setInterval(() => scanAndSendReminders().catch((e) => console.error("Reminder scan failed", e)), intervalMs);
}

module.exports = { startReminderService };