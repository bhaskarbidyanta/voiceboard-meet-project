let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  nodemailer = null;
  console.warn("nodemailer not installed — will try HTTP Mailgun if configured");
}

const axios = require('axios');
const qs = require('qs');

let transporter = null;
let provider = null;
let useMailgunHttp = false;
let mgApiKeyVar = null;

// Priority: MAILGUN_API_KEY (HTTP API) > nodemailer Mailgun SMTP > nodemailer generic SMTP
const mgApiKeyCandidate = process.env.MAILGUN_API_KEY || process.env.API_KEY_MAILGUN || process.env.API_KEY_MAILGUB;
if (mgApiKeyCandidate && process.env.MAILGUN_DOMAIN) {
  useMailgunHttp = true;
  provider = 'mailgun-http';
  mgApiKeyVar = mgApiKeyCandidate;
  console.log('EmailService: configured Mailgun HTTP API for domain', process.env.MAILGUN_DOMAIN, '(using MAILGUN_API_KEY or API_KEY_MAILGUN alias)');
} else if (nodemailer) {
  if (process.env.MAILGUN_DOMAIN && process.env.MAILGUN_SMTP_PASSWORD) {
    const domain = process.env.MAILGUN_DOMAIN;
    const user = `postmaster@${domain}`;
    transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org",
      port: parseInt(process.env.MAILGUN_SMTP_PORT || "587", 10),
      secure: (process.env.MAILGUN_SMTP_PORT || "587") === "465",
      auth: { user, pass: process.env.MAILGUN_SMTP_PASSWORD },
      requireTLS: true
    });
    provider = "mailgun-smtp";
    console.log("EmailService: configured Mailgun SMTP for domain", domain);
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    provider = "smtp";
    console.log("EmailService: configured SMTP host", host);
  } else {
    console.warn("No SMTP configuration found — emails will be no-op (set MAILGUN_* or SMTP_* env vars)");
  }
} else {
  if (!useMailgunHttp) console.warn('No mail transport available and no Mailgun HTTP API configured — emails will be no-op');
}

function formatDate(dt){
  return new Date(dt).toLocaleString();
}

async function sendMail(opts){
  // If Mailgun HTTP is configured, prefer that (doesn't require nodemailer)
  if (useMailgunHttp) {
    try {
      const domain = process.env.MAILGUN_DOMAIN;
      const from = process.env.EMAIL_FROM || `postmaster@${domain}`;
      const data = {
        from,
        to: opts.to,
        subject: opts.subject,
      };
      if (opts.text) data.text = opts.text;
      if (opts.html) data.html = opts.html;

      // Prefer mailgun.js SDK if available
      try {
        const FormData = require('form-data');
        const Mailgun = require('mailgun.js');
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({ username: 'api', key: mgApiKeyVar || process.env.MAILGUN_API_KEY });
        const sdkRes = await mg.messages.create(domain, data);
        console.log('Email sent via mailgun.js SDK', { to: opts.to, subject: opts.subject });
        return sdkRes;
      } catch (sdkErr) {
        // SDK not installed or failed — fall back to raw HTTP
        console.warn('mailgun.js SDK not available or failed, falling back to HTTP:', sdkErr && sdkErr.message);
      }

      const url = `https://api.mailgun.net/v3/${domain}/messages`;
      const res = await axios.post(url, qs.stringify(data), {
        auth: { username: 'api', password: mgApiKeyVar || process.env.MAILGUN_API_KEY },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log('Email sent via Mailgun HTTP', { to: opts.to, subject: opts.subject });
      return res.data;
    } catch (e) {
      console.error('Failed to send via Mailgun HTTP', e.response && e.response.data ? e.response.data : e.message);
      throw e;
    }
  }

  if (!transporter) {
    console.warn("sendMail skipped (no transporter) ->", opts.to, opts.subject);
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM || (transporter.options && transporter.options.auth && transporter.options.auth.user) || process.env.SMTP_USER;
  const mail = Object.assign({ from }, opts);
  try {
    const info = await transporter.sendMail(mail);
    console.log("Email sent", { to: opts.to, subject: opts.subject, provider });
    return info;
  } catch (e) {
    console.error("Failed to send email", e);
    throw e;
  }
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
  sendResponseConfirmation,
  sendWelcomeEmail,
  // For debugging & tests: send a raw mail object { to, subject, text, html }
  sendRawEmail: sendMail
};