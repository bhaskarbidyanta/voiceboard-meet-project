require('dotenv').config();
const API_KEY = process.env.API_KEY_MAILGUN || process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;
(async () => {
  if (!API_KEY || !DOMAIN) return console.error('Set API_KEY_MAILGUN (or MAILGUN_API_KEY) and MAILGUN_DOMAIN in env');
  try {
    const FormData = require('form-data');
    const Mailgun = require('mailgun.js');
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: API_KEY });

    const data = {
      from: process.env.EMAIL_FROM || `Mailgun Sandbox <postmaster@${DOMAIN}>`,
      to: ['Bhaskar Sanjay Bidyanta <bhaskar.bid18@gmail.com>'],
      subject: 'Hello Bhaskar Sanjay Bidyanta',
      text: 'Congratulations Bhaskar Sanjay Bidyanta, you just sent an email with Mailgun! You are truly awesome!'
    };

    const res = await mg.messages.create(DOMAIN, data);
    console.log('Mailgun JS send result:', res);
  } catch (e) {
    console.error('Mailgun JS failed', e);
  }
})();