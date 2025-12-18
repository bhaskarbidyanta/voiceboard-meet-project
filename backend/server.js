require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const transcriptRoutes = require("./routes/transcriptRoutes");

connectDB();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/users", userRoutes);
app.use("/meetings", meetingRoutes);
//app.use(express.json());
app.use("/api/transcript", transcriptRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
