require('dotenv').config();
const emailService = require('../services/emailService');

(async () => {
  try {
    const res = await emailService.sendRawEmail({ to: 'test@example.com', subject: 'Direct test', text: 'Direct test' });
    console.log('Result:', res);
  } catch (e) {
    console.error('Error sending:', e);
  }
})();