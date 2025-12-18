const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema({
    rawText: String,
    structuredData: Object,
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Transcript", TranscriptSchema);