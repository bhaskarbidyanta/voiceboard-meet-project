const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, index: true },
    role: String,
    availability: Array
});

module.exports = mongoose.model("User", UserSchema);