const http = require('http');
const data = JSON.stringify({ to: 'test@example.com', subject: 'Hello from test', text: 'This is a test' });

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/debug/send-test-email',
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