const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true
        },
        peopleTagged: {
            type: [mongoose.Schema.Types.ObjectId],
        },
        date: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            required: true
        },
        files: [{
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
            required: true
        }],
        likes: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
        likescount: {
            type: Number,
            required: true,
            default: 0
        },
        posted_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Post", schema);