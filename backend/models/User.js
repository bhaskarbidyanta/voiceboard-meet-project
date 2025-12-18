const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    role: String,
    availability: Array
});

module.exports = mongoose.model("User", UserSchema);