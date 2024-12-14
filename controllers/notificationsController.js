const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const notificationsCollection = require("../models/notifications");
const postCollection = require("../models/post");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants, limitHelper } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId, generateUniqueFileName } = require("../helpers/s3helper")
const { formatDateForComments } = require("../helpers/timehelper")


const getNotifications = async (req, res) => {
    let output = {}
    let requestsPipeline = [
        {
            $match: {
                _id: {
                    $in: req.user.connectionRequests
                }
            }
        },
        {
            $project: {
                _id: 1,
                pic: 1,
                city: 1,
                username: 1
            }
        },
        {
            $limit: 5
        }
    ]
    let suggestionsPipeline = [
        {
            $match: {
                _id: {
                    $nin: [...req.user.connectionRequests, ...req.user.connectionRequestssent, ...req.user.connections, req.user._id]
                }
            }
        },
        {
            $project: {
                _id: 1,
                pic: 1,
                city: 1,
                username: 1
            }
        },
        {
            $sample: {
                size: 5
            }
        }
    ]
    let notificationsPipeline = [
        {
            $match: {
                notification_for: req.user._id
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "post_id",
                foreignField: "_id",
                as: "result"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "notification_raised_by",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $project: {
                user: 1,
                notification: "$notification_text",
                time: "$createdAt",
                pic: { $arrayElemAt: [{ $arrayElemAt: ["$result.files", 0] }, 0] }, // Extract the first element of the array
                userPic: { $arrayElemAt: ["$user.pic", 0] } // Extract the first element of the array
            }
        },
        { $limit: 5 }
    ]

    output.requests = await userCollection.aggregate(requestsPipeline)
    output.suggestions = await userCollection.aggregate(suggestionsPipeline)
    output.notifications = await notificationsCollection.aggregate(notificationsPipeline)
    output.notifications = output.notifications.map(item => {
        return {
            ...item, // Spread the existing properties of the item
            time: formatDateForComments(item.time), // Update the time field
        };
    });
    return new SuccessResponse(res, { ...output })
}

const getSuggestions = async (req, res) => {
    try {
        let output = {}
        let pipeline = [
            {
                $match: {
                    _id: {
                        $nin: [...req.user.connectionRequests, ...req.user.connectionRequestssent, ...req.user.connections, req.user._id]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    pic: 1,
                    city: 1,
                    username: 1
                }
            },
            ...limitHelper(req.query.page)
        ]
        output.suggestions = await userCollection.aggregate(pipeline)
        output.isLastPage = output.suggestions.length < constants.PAGE_LIMIT ? true : false
        return new SuccessResponse(res, { ...output })
    }
    catch (error) {
        console.log(error.message)
        return new ErrorResponse(res, "Failed to get suggestions", 500)
    }
}
const getRequests = async (req, res) => {
    try {
        let output = {}
        let pipeline = [
            {
                $match: {
                    _id: {
                        $in: req.user.connectionRequests
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    pic: 1,
                    city: 1,
                    username: 1
                }
            },
            ...limitHelper(req.query.page)
        ]
        output.suggestions = await userCollection.aggregate(pipeline)
        output.isLastPage = output.suggestions.length < constants.PAGE_LIMIT ? true : false
        return new SuccessResponse(res, { ...output })
    }
    catch (error) {
        console.log(error.message)
        return new ErrorResponse(res, "Failed to get suggestions", 500)
    }
}

const getLastDays = async (req, res) => {
    try {
        let output = {}
        let pipeline = [
            {
                $match: {
                    notification_for: req.user._id
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "post_id",
                    foreignField: "_id",
                    as: "result"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "notification_raised_by",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $project: {
                    notification: "$notification_text",
                    time: "$createdAt",
                    pic: { $arrayElemAt: [{ $arrayElemAt: ["$result.files", 0] }, 0] }, // Extract the first element of the array
                    userPic: { $arrayElemAt: ["$user.pic", 0] } // Extract the first element of the array
                }
            },
            ...limitHelper(req.query.page)
        ]
        output.notifications = await notificationsCollection.aggregate(pipeline)
        output.notifications = output.notifications.map(item => {
            return {
                ...item, // Spread the existing properties of the item
                time: formatDateForComments(item.time), // Update the time field
            };
        });
        output.isLastPage = output.notifications.length < constants.PAGE_LIMIT ? true : false
        return new SuccessResponse(res, { ...output })
    }
    catch (error) {
        console.log(error.message)
        return new ErrorResponse(res, "Failed to get suggestions", 500)
    }
}

module.exports = {
    getNotifications,
    getSuggestions,
    getRequests,
    getLastDays
}   