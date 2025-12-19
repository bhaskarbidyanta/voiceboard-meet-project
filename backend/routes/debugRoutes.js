const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const path = require('path');

// POST /api/debug/send-test-email
// body: { to, subject, text, html }
router.post('/send-test-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to) return res.status(400).json({ error: 'to is required' });
  try {
    const result = await emailService.sendRawEmail({ to, subject: subject || 'Test email from Voiceboard', text: text || 'This is a test email from Voiceboard.' , html });
    return res.json({ ok: true, result });
  } catch (e) {
    console.error('Test email failed', e);
    return res.status(500).json({ error: 'Failed to send email', details: e.message });
  }
});

// POST /api/debug/send-mailgun-js
// Uses mailgun.js SDK (FormData) to send a message using API key
router.post('/send-mailgun-js', async (req, res) => {
  const { to, subject, text } = req.body;
  const API_KEY = process.env.API_KEY_MAILGUN || process.env.MAILGUN_API_KEY;
  const DOMAIN = process.env.MAILGUN_DOMAIN;
  if (!API_KEY || !DOMAIN) return res.status(400).json({ error: 'MAILGUN API key and DOMAIN must be set (API_KEY_MAILGUN or MAILGUN_API_KEY, and MAILGUN_DOMAIN)' });

  try {
    const FormData = require('form-data');
    const Mailgun = require('mailgun.js');
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: API_KEY });

    const data = {
      from: process.env.EMAIL_FROM || `Mailgun Sandbox <postmaster@${DOMAIN}>`,
      to: Array.isArray(to) ? to : [to],
      subject: subject || 'Test mail from mailgun.js',
      text: text || 'This is a test email from Mailgun JS SDK'
    };

    const response = await mg.messages.create(DOMAIN, data);
    return res.json({ ok: true, response });
  } catch (e) {
    console.error('mailgun.js send failed', e);
    return res.status(500).json({ error: 'mailgun.js send failed', details: e && e.message ? e.message : e });
  }
});

// POST /api/debug/test-mail-config
// body: { mode: 'mailgun-http' | 'mailgun-smtp' | 'smtp', config: {...}, to, subject, text, html }
router.post('/test-mail-config', async (req, res) => {
  const { mode, config, to, subject, text, html } = req.body;
  if (!mode || !config || !to) return res.status(400).json({ error: 'mode, config and to are required' });
  try {
    if (mode === 'mailgun-http') {
      const { apiKey, domain, from } = config;
      if (!apiKey || !domain) return res.status(400).json({ error: 'apiKey and domain required for mailgun-http' });
      const axios = require('axios');
      const qs = require('qs');
      const data = { from: from || `postmaster@${domain}`, to, subject: subject || 'Test email', text: text || 'Test', html };
      const url = `https://api.mailgun.net/v3/${domain}/messages`;
      const resp = await axios.post(url, qs.stringify(data), { auth: { username: 'api', password: apiKey }, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      return res.json({ ok: true, provider: 'mailgun-http', result: resp.data });
    }

    // SMTP tests (supports mailgun-smtp and generic smtp)
    let nodemailer;
    try { nodemailer = require('nodemailer'); } catch (e) { return res.status(400).json({ error: 'nodemailer not installed' }); }

    let transportOptions = {};
    if (mode === 'mailgun-smtp') {
      const { domain, password, host, port, secure, from } = config;
      if (!domain || !password) return res.status(400).json({ error: 'domain and password required for mailgun-smtp' });
      transportOptions = { host: host || 'smtp.mailgun.org', port: port || 587, secure: !!secure, auth: { user: `postmaster@${domain}`, pass: password } };
      transportOptions.from = from || `postmaster@${domain}`;
    } else if (mode === 'smtp') {
      const { host, port, secure, user, pass, from } = config;
      if (!host || !user || !pass) return res.status(400).json({ error: 'host, user, pass required for smtp' });
      transportOptions = { host, port: port || (secure ? 465 : 587), secure: !!secure, auth: { user, pass } };
      transportOptions.from = from || user;
    } else {
      return res.status(400).json({ error: 'unsupported mode' });
    }

    const transporter = nodemailer.createTransport(transportOptions);
    const info = await transporter.sendMail({ from: transportOptions.from, to, subject: subject || 'Test email', text: text || 'Test', html });
    return res.json({ ok: true, provider: mode, result: info });
  } catch (e) {
    console.error('Config test failed', e);
    return res.status(500).json({ error: 'Config test failed', details: e.response && e.response.data ? e.response.data : e.message });
  }
});

module.exports = router;