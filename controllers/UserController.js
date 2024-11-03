const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const postCollection = require("../models/post");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId, generateUniqueFileName } = require("../helpers/s3helper")

const protectedRoute = async (req, res) => {
    await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
    return new SuccessResponse(res, { message: getFileMetadata(req.file) })
}

const getUsers = async (req, res) => {
    let output = {}
    output.isLastPage = false
    try {
        let userPipeline = [
            {
                $match: {
                    _id: {
                        $ne: req.user._id
                    },
                    $or: [
                        { username: { $regex: new RegExp(req.query.search, 'i') } },
                        { university: { $regex: new RegExp(req.query.search, 'i') } },
                        { city: { $regex: new RegExp(req.query.search, 'i') } }
                    ],
                    accomodation: req.query.available === 'true'
                }
            },
            {
                $project: {
                    _id: 1,
                    city: 1,
                    connectionRequests: 1,
                    connectionRequestssent: 1,
                    connections: 1,
                    username: 1,
                    pic: 1
                }
            },
            {
                $skip: constants.PAGE_LIMIT * parseInt(req.query.page)
            },
            {
                $limit: constants.PAGE_LIMIT
            }
        ]
        if (req.query.available == "NA") {
            userPipeline = [
                {
                    $match: {
                        _id: {
                            $ne: req.user._id
                        },
                        username: {
                            $regex: new RegExp(req.query.search, 'i')
                        },
                    }
                },
                {
                    $project: {
                        _id: 1,
                        city: 1,
                        connectionRequests: 1,
                        connectionRequestssent: 1,
                        connections: 1,
                        username: 1,
                        pic: 1
                    }
                },
                {
                    $skip: constants.PAGE_LIMIT * parseInt(req.query.page)
                },
                {
                    $limit: constants.PAGE_LIMIT
                }
            ]
        }
        output.users = await userCollection.aggregate(userPipeline)
        if (output.users.length < constants.PAGE_LIMIT) {
            output.isLastPage = true
        }
        return new SuccessResponse(res, { message: output })
    }
    catch (e) {
        console.log("error in getUsers: ", e.message)
        return new ErrorResponse(res, "error in getting users")
    }
}
const sendConnectionRequest = async (req, res) => {
    try {
        console.log(req.body)
        let user = await userCollection.findOne({ _id: req.body.user_id })
        let connectionRequests = new Set(user.connectionRequests.map(obj => obj.toString()))
        let connections = new Set(user.connections.map(obj => obj.toString()))
        if (_.isEqual(mongoId(req.body.user_id), req.user._id)) {
            return new ErrorResponse(res, { "message": "not allowed" })
        }
        if (connections.has(req.user._id.toString())) {
            return new ErrorResponse(res, "you are already connected")
        }
        if (req.body.send) {
            if (!connectionRequests.has((req.user._id.toString()))) {
                req.user.connectionRequestssent.push(mongoId(req.body.user_id))
                user.connectionRequests.push(req.user._id)
                user.save()
                req.user.save()
            }
        }
        else if (!req.body.send) {
            if (connectionRequests.has(req.user._id.toString())) {
                user.connectionRequests = user.connectionRequests.filter(_id =>
                    !_.isEqual(_id, req.user._id)
                );
                req.user.connectionRequestssent = req.user.connectionRequestssent.filter(_id =>
                    !_.isEqual(_id, mongoId(req.body.user_id))
                )
                user.save()
                req.user.save()
            }
        }
        return new SuccessResponse(res, { message: "success" })
    }
    catch (e) {
        console.log("error in sendConnectionRequest: ", e.message)
        return new ErrorResponse(res, "error in sendConnectionRequest")
    }
}

const acceptConnectionRequest = async (req, res) => {
    try {
        let user = await userCollection.findOne({ _id: req.body.user_id })
        let connectionRequests = new Set(user.connectionRequests.map(obj => obj.toString()))
        let connections = new Set(user.connections.map(obj => obj.toString()))
        if (_.isEqual(mongoId(req.body.user_id), req.user._id)) {
            return new ErrorResponse(res, "not allowed")
        }
        if (connections.has(req.user._id.toString())) {
            return new ErrorResponse(res, "you are already connected")
        }
        if (connectionRequests.has(req.user._id.toString())) {
            return new ErrorResponse(res, "no connection request found")
        }
        user.connectionRequestssent = user.connectionRequestssent.filter(_id => !_.isEqual(_id, req.user._id))
        user.connections.push(req.user._id)
        req.user.connectionRequests = req.user.connectionRequests.filter(_id => !_.isEqual(_id, mongoId(req.body.user_id)))
        req.user.connections.push(req.body.user_id)
        user.save()
        req.user.save()
        return new SuccessResponse(res, { message: req.body })
    }
    catch (e) {
        console.log("error in acceptConnectionRequest", e.message)
        return new ErrorResponse(res, "error in acceptConnectionRequest")
    }
}

const getLoggedInUser = async (req, res) => {
    let output = {}
    output.fullname = req.user.fullname
    output.username = req.user.username
    output.city = req.user.city
    output.accomodation = req.user.accomodation
    output.username = req.user.username
    output.university = req.user.university
    output.pic = req.user.pic
    output.bio = req.user.bio
    output.connectionslength = req.user.connections.length
    let postsPipeline = [
        {
            $match: {
                posted_by: req.user._id
            }
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.posts = await postCollection.aggregate(postsPipeline)

    return new SuccessResponse(res, { user: output })
}
const getLoggedInUserPosts = async (req, res) => {
    let output = {}
    output.isLastPage = false
    let postsPipeline = [
        {
            $match: {
                posted_by: req.user._id
            }
        },
        {
            $skip: constants.PAGE_LIMIT * parseInt(req.query.page)
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.posts = await postCollection.aggregate(postsPipeline)
    if (output.posts.length < constants.PAGE_LIMIT) {
        output.isLastPage = true
    }
    return new SuccessResponse(res, { posts: output })
}

const getUserProfile = async (req, res) => {
    const userPipeline = [
        {
            $match: {
                _id: mongoId(req.query.user_id)
            }
        }
    ]
    let output = {}
    let user = await userCollection.aggregate(userPipeline)
    user = user[0]
    output.fullname = user.fullname
    output.username = user.username
    output.city = user.city
    output.accomodation = user.accomodation
    output.username = user.username
    output.university = user.university
    output.pic = user.pic
    output.bio = user.bio
    output.connectionslength = user.connections.length
    output._id = user._id
    let postsPipeline = [
        {
            $match: {
                posted_by: mongoId(req.query.user_id)
            }
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.posts = await postCollection.aggregate(postsPipeline)

    return new SuccessResponse(res, { user: output })
}
const getUserPosts = async (req, res) => {
    let output = {}
    output.isLastPage = false
    let postsPipeline = [
        {
            $match: {
                posted_by: req.user._id
            }
        },
        {
            $skip: constants.PAGE_LIMIT * parseInt(req.query.page)
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.posts = await postCollection.aggregate(postsPipeline)
    if (output.posts.length < constants.PAGE_LIMIT) {
        output.isLastPage = true
    }
    return new SuccessResponse(res, { posts: output })
}
 
const editProfilePost = async (req, res) => {
    let user = await userCollection.findOne({ _id: req.user._id })
    if (req.body.changePic=='true') {
        const filename = generateUniqueFileName(req.file.originalname);
        await uploadFile(filename, req.file.buffer, req.file.mimetype);
        const uploadedFile = getFileMetadata({ ...req.file, unqFileName: filename });
        user.pic = uploadedFile
    }
    user.fullname = req.body.fullname
    user.username = req.body.username
    user.bio = req.body.bio
    user.city = req.body.city
    user.university = req.body.university
    user.accomodation = req.body.accomodation
    await user.save()
    return new SuccessResponse(res, "hello")
}

module.exports = {
    getUsers,
    sendConnectionRequest,
    getLoggedInUser,
    acceptConnectionRequest,
    getLoggedInUserPosts,
    getUserProfile,
    getUserPosts,
    editProfilePost
}