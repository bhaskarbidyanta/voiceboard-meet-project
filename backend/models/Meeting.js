const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
    employeeId: String,
    managerId: String,
    startTime: Date,
    endTime: Date,
    status: String
});

module.exports = mongoose.model("Meeting", MeetingSchema);