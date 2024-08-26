const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const { uploadFile, getFileMetadata } = require("../helpers/s3helper")

const protectedRoute = async (req, res) => {
    await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
    return new SuccessResponse(res, { message: getFileMetadata(req.file) })
}


const Dashboard = async (req, res) => {
    return new SuccessResponse(res, { message: "dashboard" })
}

module.exports = {
    protectedRoute,
    Dashboard
}   