const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

module.exports = async () => {
  // start in-memory mongo
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // cleanup after tests
  const teardown = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  };

  // expose teardown for afterAll in tests
  global.__MONGO_TEARDOWN__ = teardown;

  // ensure any open handles are closed after tests
  process.on('exit', async () => {
    try { await teardown(); } catch (e) { /* ignore */ }
  });
};