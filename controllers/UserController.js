const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const postCollection = require("../models/post");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId } = require("../helpers/s3helper")

const protectedRoute = async (req, res) => {
    await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
    return new SuccessResponse(res, { message: getFileMetadata(req.file) })
}

const getUsers = async (req, res) => {
    return new SuccessResponse(res, { message: req.user })
}
const sendConnectionRequest = async (req, res) => {
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

module.exports = {
    getUsers,
    sendConnectionRequest,
    acceptConnectionRequest
}