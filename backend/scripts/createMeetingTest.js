require('dotenv').config();
const http = require('http');

const data = JSON.stringify({
  title: 'Test meeting invite link',
  organizerId: '69447cb044d577cfa038ad72',
  participants: [ { email: 'bhaskar.bid18@gmail.com' } ],
  startTime: new Date(Date.now() + 3600000).toISOString(),
  reminders: [60]
});

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/meetings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => console.log('Response:', body));
});

req.on('error', (err) => console.error('Request error', err));
req.write(data);
req.end();