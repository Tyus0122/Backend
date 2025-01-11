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
            requires: true,
            unique: true
        },
        dob: {
            type: String,
            requires: true
        },
        phno: {
            type: String,
            requires: true
        },
        phnocode: {
            type: String,
            requires: true
        },
        password: {
            type: String,
            default: null
        },
        hashPassword: {
            type: String,
            default: null
        },
        otp: {
            type: String,
            requires: true
        },
        connectionRequests: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        connectionRequestssent: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        connections: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        blocked_users: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        city: {
            type: String,
            default: "N-A"
        },
        accomodation: {
            type: Boolean,
            default: false
        },
        university: {
            type: String,
            default: "N-A"
        },
        bio: {
            type: String,
            default: "N-A"
        },
        pic: {
            type: {
                url: {
                    type: String,
                    required: true
                },
                size: {
                    type: String,
                    required: true
                },
                mimeType: {
                    type: String,
                    required: true
                },
                fileName: {
                    type: String,
                    required: true

                }
            },
        },
        saved_posts: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        reported_by: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("User", schema);