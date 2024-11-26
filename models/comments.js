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
        parent_comment_id:{
            type:mongoose.Schema.Types.ObjectId,
        },
        commentedBy:{
            type:mongoose.Schema.Types.ObjectId,
        },
        likes: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Comments", schema);