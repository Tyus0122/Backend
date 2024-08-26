const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            requires: true
        },
        username: {
            type: String,
            requires: true
        },
        email: {
            type: String,
            requires: true
        },
        dob: {
            type: String,
            requires: true
        },
        phno: {
            type: String,
            requires: true
        },
        password: {
            type: String,
            requires: true
        },
        hashPassword: {
            type: String,
            requires: true
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("User", schema);