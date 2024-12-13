const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        notification_text: {
            type: String,
            required: true
        },
        notification_raised_by: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        post_id: {
            type: mongoose.Schema.Types.ObjectId,
        },
        notification_for: {
            type: mongoose.Schema.Types.ObjectId,
        }
        // comment_id: {
        //     type: mongoose.Schema.Types.ObjectId
        // }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Notifications", schema);