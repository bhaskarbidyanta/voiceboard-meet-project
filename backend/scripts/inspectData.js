require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voiceboard');
    const users = await User.find().lean();
    const meetings = await Meeting.find().populate('organizer participants.user').lean();
    console.log('Users:');
    users.forEach(u => console.log(JSON.stringify(u, null, 2)));
    console.log('\nMeetings:');
    meetings.forEach(m => console.log(JSON.stringify(m, null, 2)));
    await mongoose.disconnect();
  } catch (e) {
    console.error('Inspect failed', e);
  }
})();