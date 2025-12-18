const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, index: true },
    officeEmail: { type: String, index: true },
    role: String,
    availability: Array,
    verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);