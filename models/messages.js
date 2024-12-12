const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        conversation_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Messages", schema);