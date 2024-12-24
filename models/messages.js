const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false
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
            required: false
        },
        type: {
            type: String,
            required: true
        },
        is_deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Messages", schema);