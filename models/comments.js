const mongoose = require("mongoose");

let schema = new mongoose.Schema(
    {
        post_id:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        comment: {
            type: String,
            required: true,
        },
        replyfor:{
            type:mongoose.Schema.Types.ObjectId,
        },
        commentedBy:{
            type:mongoose.Schema.Types.ObjectId,
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model("Comments", schema);