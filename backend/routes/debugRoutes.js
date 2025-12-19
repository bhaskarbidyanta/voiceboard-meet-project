const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

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

module.exports = router;