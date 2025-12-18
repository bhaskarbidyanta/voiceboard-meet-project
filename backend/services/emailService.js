const nodemailer = require("nodemailer");

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("SMTP_USER or SMTP_PASS not set — email sending will fail without credentials");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function formatDate(dt){
  return new Date(dt).toLocaleString();
}

async function sendMail(opts){
  const mail = Object.assign({ from: process.env.SMTP_USER }, opts);
  return transporter.sendMail(mail);
}

function buildResponseLinks(meetingId, email){
  const base = process.env.FRONTEND_URL || (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`);
  const accept = `${base}/api/meetings/${meetingId}/respond?action=accepted&email=${encodeURIComponent(email)}`;
  const decline = `${base}/api/meetings/${meetingId}/respond?action=declined&email=${encodeURIComponent(email)}`;
  return { accept, decline };
}

async function sendInviteEmail(meeting, toEmail){
  const links = buildResponseLinks(meeting._id, toEmail);
  const subject = `Invitation: ${meeting.title} at ${formatDate(meeting.startTime)}`;
  const text = `You are invited to ${meeting.title} at ${formatDate(meeting.startTime)}.\n\nAccept: ${links.accept}\nDecline: ${links.decline}`;
  return sendMail({ to: toEmail, subject, text });
}

async function sendWelcomeEmail(user){
  if (!user || !user.email) return;
  const subject = `Welcome to Voiceboard Meet, ${user.name || ""}`;
  const text = `Hi ${user.name || ""},\n\nYour account (${user.email}) has been created. You can now create and join meetings at ${process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`}.\n\nThanks!`;
  try {
    return sendMail({ to: user.email, subject, text });
  } catch (e) {
    console.error("Failed to send welcome email", e);
  }
}

async function sendReminderEmail(meeting, toEmail){
  const subject = `Reminder: ${meeting.title} starts at ${formatDate(meeting.startTime)}`;
  const text = `Reminder: ${meeting.title} starts at ${formatDate(meeting.startTime)}.\n\nJoin or view details in the app.`;
  return sendMail({ to: toEmail, subject, text });
}

async function sendUpdateEmail(meeting, toEmail){
  const subject = `Updated: ${meeting.title}`;
  const text = `Meeting "${meeting.title}" has been updated. New time: ${formatDate(meeting.startTime)}.`;
  return sendMail({ to: toEmail, subject, text });
}

async function sendResponseConfirmation(meeting, toEmail, status){
  const subject = `Response received: ${meeting.title}`;
  const text = `Your response (${status}) for "${meeting.title}" has been recorded.`;
  return sendMail({ to: toEmail, subject, text });
}

module.exports = {
  sendInviteEmail,
  sendReminderEmail,
  sendUpdateEmail,
  sendResponseConfirmation
};