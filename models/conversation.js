const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        users: [mongoose.Schema.Types.ObjectId],
        lastMessage: {
            type: String,
        },
        lastMessageTime: {
            type: Date,
            default: Date.now(),
        },
        senderId: {
            type:mongoose.Schema.Types.ObjectId
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Conversation", schema);