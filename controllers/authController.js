const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const jwt = require("jsonwebtoken")
const userCollection = require("../models/user");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const bcrypt = require('bcrypt');

const loginSubmit = async (req, res) => {
    try {
        const user = await userCollection.findOne({ email: req.body.email });
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 404)
        }
        const isMatch = await bcrypt.compare(req.body.password, user.hashPassword);
        if (!isMatch) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 404)
        }
        obj = {
            _id: user._id
        }
        const accessToken = jwt.sign({ obj }, process.env.USER_SECRET, { expiresIn: "12h" })
        return new SuccessResponse(res, { BearerToken: accessToken });
    }
    catch (err) {
        console.log("error in loginSubmit: ", err.message)
    }
}

const login = async (req, res) => {
    return new SuccessResponse(res, { message: "login" });
}

const signup = async (req, res) => {
    return new SuccessResponse(res, { message: "signup" });
}

const signupSubmit = async (req, res) => {
    try {
        let user = await userCollection.findOne({ email: req.body.email })
        if (!_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_ALREADY_EXISTS, 201);
        }
        let hashPassword = await bcrypt.hash(req.body.password, constants.SALT_ROUNDS)
        const result = await userCollection.create({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            dob: req.body.dob,
            phno: req.body.phno,
            password: req.body.password,
            hashPassword: hashPassword
        })
        return new SuccessResponse(res, { message: req.body });
    }
    catch (err) {
        console.log("error in signupSubmit: ", err.message);
        return new ErrorResponse(res, "error in signupSubmit: ")
    }
}

const getOtp = async (req, res) => {
    try {
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 201);
        }
        let otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        await userCollection.updateOne({ phno: req.body.phno }, { otp: otp })
        return new SuccessResponse(res, { message: otp })
    }
    catch (err) {
        console.log("error in getOtp: ", err.message)
        return new ErrorResponse(res, "error in getOtp")
    }
}

const postOtp = async (req, res) => {
    try {
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 201);
        }
        if (user.otp === req.body.otp) {
            return new SuccessResponse(res, { message: "success" })
        }
        else {
            return new ErrorResponse(res, constants.INVALID_OTP)
        }
    }
    catch (err) {
        console.log("error in postOtp", err.message)
        return new ErrorResponse({ message: "errror in postOtp" })
    }
}
const passwordChange = async (req, res) => {
    try {
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 201);
        }
        let hashPassword = await bcrypt.hash(req.body.password, constants.SALT_ROUNDS)
        await userCollection.updateOne({ phno: req.body.phno }, { password: req.body.password, hashPassword: hashPassword })
        return new SuccessResponse(res, { message: 'success' })
    }
    catch (err) {
        console.log("errror in passwordChange", err.message)
        return new ErrorResponse(err, "error in passwordChange")
    }
}


module.exports = {
    loginSubmit,
    login,
    signupSubmit,
    signup,
    getOtp,
    postOtp,
    passwordChange
}