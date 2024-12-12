const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
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
        }
    ]
    let suggestionsPipeline = [
        {
            $match: {
                _id: {
                    $nin: [...req.user.connectionRequests, ...req.user.connectionRequestssent, ...req.user.connections]
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
    output.requests = await userCollection.aggregate(requestsPipeline)
    output.suggestions = await userCollection.aggregate(suggestionsPipeline)
    return new SuccessResponse(res, { ...output })
}

module.exports = {
    getNotifications
}   