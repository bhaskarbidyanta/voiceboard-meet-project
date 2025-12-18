const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const transcriptRoutes = require("./routes/transcriptRoutes");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  app.use("/users", userRoutes);
  app.use("/api/meetings", meetingRoutes);
  app.use(express.json());
  app.use("/api/transcript", transcriptRoutes);

  return app;
}

module.exports = createApp;