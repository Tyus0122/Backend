const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const postCollection = require("../models/post");
const conversationCollection = require("../models/conversation");
const messagesCollection = require("../models/messages");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants, limitHelper } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId } = require("../helpers/s3helper")
const { formatDate } = require("../helpers/timehelper");
const creategetAdminChat = async (req, res) => {
    try {
        let response = {}
        let conversationPipeline = [
            {
                $match: {
                    users: {
                        $size: 1,  // Ensures the users array has exactly 1 element
                        $in: [req.user._id]  // Checks that the single element is the user._id
                    }
                }
            }
        ]
        let conversation = await conversationCollection.aggregate(conversationPipeline)
        if (conversation.length > 0) {
            let messagesPipeline = [
                {
                    $match: {
                        conversation_id: conversation[0]._id
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
                        type: 1,
                        is_deleted: {
                            $cond: {
                                if: { $eq: ["$is_deleted", true] },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                ...limitHelper(req.query.page)
            ]
            response.messages = await messagesCollection.aggregate(messagesPipeline)
            response.isLastPage = response.messages.length < constants.PAGE_LIMIT ? true : false
            response.conversation_id = conversation[0]._id
            response.logged_in_user_id = req.user._id
            return new SuccessResponse(res, { ...response })

        }
        else {
            const conversation = new conversationCollection({
                users: [req.user._id],
                lastMessage: `Hello good morning ${req.user.fullname}, How can I help you...`

            })
            await conversation.save()
            response.conversation_id = conversation._id
            let newmessage = new messagesCollection({
                conversation_id: conversation._id,
                sender_id: null,
                message: `Hello good morning ${req.user.fullname}, How can I help you...`,
                type: 'message',
                createdAt: new Date()
            })
            await newmessage.save()
            newmessage.is_deleted = false
            newmessage.isSender = false
            newmessage.time = newmessage.createdAt
            response.messages = [newmessage]
            response.isLastPage = true
            response.logged_in_user_id = req.user._id
            return new SuccessResponse(res, { ...response })
        }
    }
    catch (error) {
        console.log("error in creategetadminchatcontroller", error.message)
        return new ErrorResponse(res, error.message)
    }
}

const getUsersForAdmin = async (req, res) => {
    try {
        let response = {}
        let conversationPipelnie = [
            {
                $match: {
                    $expr: {
                        $eq: [{ $size: "$users" }, 1] // Match documents where users array has size 1
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $lookup: {
                    from: "users", // Target collection to join
                    let: { userId: { $arrayElemAt: ["$users", 0] } }, // Extract the first element of the users array
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$userId"] } // Match the user ID with the extracted userId
                            }
                        }
                    ],
                    as: "result" // Store the result in the 'result' field
                }
            }
        ]
        response.users = await conversationCollection.aggregate(conversationPipelnie)
        let messagesPipeline = [
            {
                $match: {
                    conversation_id: response.users[0]._id
                }
            },
            {
                $project: {
                    message: 1,
                    time: "$createdAt",
                    isSender: {
                        $cond: {
                            if: { $eq: ["$sender_id", null] },
                            then: true,
                            else: false
                        }
                    },
                    type: 1,
                    is_deleted: {
                        $cond: {
                            if: { $eq: ["$is_deleted", true] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
        ]
        response.messages = await messagesCollection.aggregate(messagesPipeline)
        return new SuccessResponse(res, { ...response })
    } catch (error) {
        console.log("error in getUsers", error.message)
        throw new ErrorResponse(res, "Failed to get users")
    }
}
const getAdminMessages = async (req, res) => {
    try {
        let response = {}
        let messagesPipeline = [
            {
                $match: {
                    conversation_id: mongoId(req.query.conversation_id)
                }
            },
            {
                $project: {
                    message: 1,
                    time: "$createdAt",
                    isSender: {
                        $cond: {
                            if: { $eq: ["$sender_id", null] },
                            then: true,
                            else: false
                        }
                    },
                    type: 1,
                    is_deleted: {
                        $cond: {
                            if: { $eq: ["$is_deleted", true] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
        ]
        response.messages = await messagesCollection.aggregate(messagesPipeline)
        return new SuccessResponse(res, { ...response })
    }
    catch (error) {
        console.log("error in getAdminMessages", error.message)
        throw new ErrorResponse(res, "Failed to get admin messages")
    }
}

const sendAdminMessage = async (req, res) => {
    try {
        let response = {}
        const conversation = await conversationCollection.findOneAndUpdate(
            {
                users: {
                    $size: 1, // Ensures the users array has exactly 1 element
                    $in: [mongoId(req.body.user_id)], // Checks that the single element is the user._id
                }
            },
            {
                $set: {
                    lastMessage: req.body.message,
                    lastMessageTime: new Date()
                }
            },
            {
                new: true, // This ensures that the updated document is returned
            }
        );

        const newMessage = new messagesCollection({
            conversation_id: conversation._id,
            sender_id: null,
            message: req.body.message,
            type: 'message',
            createdAt: new Date(),
        });

        // Save the new message
        await newMessage.save();
        return new SuccessResponse(res, { ...response })
    }
    catch (error) {
        console.log("error in sendAdminMessage", error.message)
        throw new ErrorResponse(res, "Failed to send admin message")
    }
}


const reportUser = async (req, res) => {
    try {
        let response = {}
        let user = await userCollection.findOne({ _id: mongoId(req.body.user_id) })
        let reported_by = user.reported_by.map(items => items.toString())
        if (reported_by.includes(req.user._id.toString())) {
            return new ErrorResponse(res, "You have already reported this user")
        }
        user.reported_by.push(req.user._id)
        await user.save()
        response.message = 'reported'
    }
    catch (error) {
        console.log("error in reportUser", error.message)
        throw new ErrorResponse(res, "Failed to report user")
    }
}
const getAdminUserList = async (req, res) => {
    try {
        let response = {}
        response.users = await userCollection.find({})
        return new SuccessResponse(res, { ...response })
    }
    catch (error) {
        console.log("error in getAdminUserList", error.message)
        throw new ErrorResponse(res, "Failed to get admin user list")
    }
}
module.exports = {
    creategetAdminChat,
    getUsersForAdmin,
    getAdminMessages,
    sendAdminMessage,
    reportUser,
    getAdminUserList
}   