const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const postCollection = require("../models/post");
const conversationCollection = require("../models/conversation");
const messagesCollection = require("../models/messages");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants, limitHelper } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId } = require("../helpers/s3helper")
const { formatDate } = require("../helpers/timehelper")

function getAnotherId(arr, _id) {
    return arr.filter(id => id !== _id.toString())[0]
}

const postProfileMessage = async (req, res) => {
    let otherUser_id = mongoId(req.body.otherUser_id)
    const conversationPipeline = [
        {
            $match: {
                $or: [
                    { users: [req.user._id, otherUser_id] },
                    { users: [otherUser_id, req.user._id] }
                ]
            }
        }
    ]
    let conversation = await conversationCollection.aggregate(conversationPipeline)
    let output = {}
    if (conversation.length === 0) {
        const conversation = new conversationCollection({
            users: [req.user._id, otherUser_id],
            lastMessage: null,
            senderId: null,
        })
        await conversation.save()
        output.conversation_id = conversation._id
    }
    else {
        output.conversation_id = conversation[0]._id
    }
    return new SuccessResponse(res, { posts: output })
}

const getMessages = async (req, res) => {
    const conversation_id = mongoId(req.query.conversation_id)
    const otherUser_id = mongoId(req.query.otherUser_id)
    let output = {}
    const messagesPipeline = [
        {
            $match: {
                conversation_id: conversation_id
            },

        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                message: 1,
                time: "$createdAt",
                isSender: {
                    $cond: {
                        if: { $eq: ["$sender_id", req.user._id] },
                        then: true,
                        else: false
                    }
                },
                type: 1
            }
        },
        {
            $limit: 20
        }
    ]
    output.messages = await messagesCollection.aggregate(messagesPipeline)
    output.show_profile = output.messages.length < 10 ? true : false
    const usersPipeline = [
        {
            $match: {
                _id: otherUser_id
            }
        }
    ]
    const otherUser = await userCollection.aggregate(usersPipeline)
    output.pic = otherUser[0].pic
    output.fullname = otherUser[0].fullname
    output.username = otherUser[0].username
    output._id = otherUser[0]._id
    output.logged_in_user_id = req.user._id
    return new SuccessResponse(res, output)
}

const getConversations = async (req, res) => {
    let output = {}
    output.conversations = []
    const conversationsPipeline = [
        {
            $match: {
                users: {
                    $in: [
                        mongoId(req.user._id)
                    ]
                }
            }
        },
        {
            $addFields: {
                otherUserId: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$users",
                                as: "userId",
                                cond: {
                                    $and: [
                                        { $ne: ["$$userId", mongoId(req.user._id)] }, // Exclude the current user
                                        { $not: { $in: ["$$userId", req.user.blocked_users] } } // Exclude blocked users
                                    ]
                                }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "otherUserId",
                foreignField: "_id",
                as: "otherUser"
            }
        },
        {
            $unwind: "$otherUser"
        },
        {
            $match: {
                "otherUser.username": { $regex: req.query.search, $options: 'i' }
            }
        },
        {
            $project: {
                otherUser_id: "$otherUser._id",
                fullname: "$otherUser.fullname",
                username: "$otherUser.username",
                pic: "$otherUser.pic",
                conversation_id: "$_id",
                lastMessage: "$lastMessage",
                lastMessageTime: "$lastMessageTime"
            }
        },
        {
            $sort: {
                lastMessageTime: -1
            }
        },
        ...limitHelper(req.query.page)
    ]
    output.conversations = await conversationCollection.aggregate(conversationsPipeline)
    output.conversations.map(conversation => conversation.lastMessageTime = formatDate(conversation.lastMessageTime))
    output.isLastPage = output.conversations.length < constants.PAGE_LIMIT ? true : false
    return new SuccessResponse(res, output)
}


const postMessages = async (req, res) => {
    output = {}
    const conversation = await conversationCollection.findOne({ _id: req.body.conversation_id })
    conversation.lastMessage = req.body.message
    conversation.senderId = req.user._id
    conversation.lastMessageTime = req.body.time
    await conversation.save();
    const message = new messagesCollection({
        sender_id: req.user._id,
        conversation_id: req.body.conversation_id,
        message: req.body.message,
        time: req.body.time,
        type: req.body.type
    })
    await message.save()
    output.message = message
    return new SuccessResponse(res, output)
}
const sharePostService = async (req, res) => {
    let { type, message, toUserIds } = req.body;
    if (!type || !message || !toUserIds || !Array.isArray(toUserIds) || toUserIds.length === 0) {
        return new ErrorResponse(res, "Invalid payload", 400)
    }
    const senderId = req.user._id; // Assume `userId` is added to `req` after authentication middleware.
    try {
        const bulkOperations = toUserIds.map(async (toUserId) => {
            const sortedUsers = [senderId, mongoId(toUserId)].sort();
            const existingConversation = await conversationCollection.findOneAndUpdate(
                {
                    users: sortedUsers, // Match exact sorted array
                },
                {
                    $setOnInsert: {
                        users: sortedUsers, // Insert sorted array if not found
                    },
                },
                { upsert: true, new: true }
            );
            const newMessage = new messagesCollection({
                sender_id: senderId,
                conversation_id: existingConversation._id,
                message: message, // Post ID being shared
                type: type, // 'sharePost'
                time: new Date().toISOString(),
            });
            await newMessage.save();
            await conversationCollection.findByIdAndUpdate(existingConversation._id, {
                lastMessage: `Shared a post`,
                lastMessageTime: new Date(),
                senderId: senderId,
            });
        });

        // Wait for all operations to complete
        await Promise.all(bulkOperations);

        res.status(200).json({ message: "Post shared successfully" });
    } catch (error) {
        console.error("Error sharing post:", error);
        res.status(500).json({ error: "An error occurred while sharing the post" });
    }
}
const shareProfileService = async (req, res) => {
    let { type, message, toUserIds } = req.body;
    if (!type || !message || !toUserIds || !Array.isArray(toUserIds) || toUserIds.length === 0) {
        return new ErrorResponse(res, "Invalid payload", 400)
    }
    const senderId = req.user._id; // Assume `userId` is added to `req` after authentication middleware.
    try {
        const bulkOperations = toUserIds.map(async (toUserId) => {
            const sortedUsers = [senderId, mongoId(toUserId)].sort();
            const existingConversation = await conversationCollection.findOneAndUpdate(
                {
                    users: sortedUsers, // Match exact sorted array
                },
                {
                    $setOnInsert: {
                        users: sortedUsers, // Insert sorted array if not found
                    },
                },
                { upsert: true, new: true }
            );
            const newMessage = new messagesCollection({
                sender_id: senderId,
                conversation_id: existingConversation._id,
                message: message, // Post ID being shared
                type: type, // 'sharePost'
                time: new Date().toISOString(),
            });
            await newMessage.save();
            await conversationCollection.findByIdAndUpdate(existingConversation._id, {
                lastMessage: `Shared a profile`,
                lastMessageTime: new Date(),
                senderId: senderId,
            });
        });

        // Wait for all operations to complete
        await Promise.all(bulkOperations);

        res.status(200).json({ message: "Profile shared successfully" });
    } catch (error) {
        console.error("Error sharing post:", error);
        res.status(500).json({ error: "An error occurred while sharing the post" });
    }
}
module.exports = {
    postProfileMessage,
    getMessages,
    postMessages,
    getConversations,
    sharePostService,
    shareProfileService
}   