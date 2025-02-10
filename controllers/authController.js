const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const jwt = require("jsonwebtoken")
const userCollection = require("../models/user");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const bcrypt = require('bcrypt');
const { sendOtp, verifyOTP, getLastOTP, phoneNumberLookup } = require('../helpers/randomHelper')
const formOtp = () => {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

const healthCheck = (req, res) => {
    return new SuccessResponse(res, { message: "health check" })
}
const loginSubmit = async (req, res) => {
    try {
        const user = await userCollection.findOne({ phno: req.body.phno });
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 404)
        }
        let response = {}
        response.otp = formOtp()
        await sendOtp(req.body.phno, response.otp)
        await userCollection.updateOne({ phno: req.body.phno }, { otp: response.otp })
        return new SuccessResponse(res, { ...response });
    }
    catch (err) {
        console.log("error in loginSubmit: ", err.message)
        return new ErrorResponse(res, "error in loginSubmit");
    }
}
const loginOtpSubmit = async (req, res) => {
    try {
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 420);
        }
        const isMatch = await bcrypt.compare(req.body.password, user.hashPassword);
        if (!isMatch) {
            return new ErrorResponse(res,'Invalid password',420)
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
        let response = {
            errorMessage: "",
            status: "ok",
        }
        let userPipeline = [
            {
                $match: {
                    $expr: {
                        $or: [
                            { $eq: ["$username", req.body.username] },
                            { $eq: ["$phno", req.body.phno] },
                            { $eq: ["$email", req.body.email] },
                        ]
                    }
                }
            }
        ]
        let user = await userCollection.aggregate(userPipeline)
        if (user.length > 0) {
            response.status = 'notok'
            if (user[0].email == req.body.email) {
                response.errorMessage = "an account with email already exists"
                return new SuccessResponse(res, { ...response });
            }
            else if (user[0].username == req.body.username) {
                response.errorMessage = "an account with username already exists"
            }
            else if (user[0]?.phno == req.body.phno) {
                response.errorMessage = "an account with phone number already exists"
            }
            return new SuccessResponse(res, { ...response });
        }
        let validPhno = await phoneNumberLookup(req.body.phno)
        if (!validPhno.valid) {
            response.status = 'notok'
            response.errorMessage = "Invalid phone number"
            return new SuccessResponse(res, { ...response });
        }
        const hashPassword = await bcrypt.hash(req.body.password, constants.SALT_ROUNDS);
        const result = await userCollection.create({
            fullname: req.body.fullname,
            username: req.body.username,
            email: req.body.email ?? "",
            dob: req.body.dob,
            phno: req.body.phno,
            phnocode: req.body.phnocode,
            password: req.body.password,
            hashPassword: hashPassword
        })
        await sendOtp(req.body.phno, response.otp)
        return new SuccessResponse(res, { message: { ...response } });
    }
    catch (err) {
        console.log("error in signupSubmit: ", err.message);
        return new ErrorResponse(res, "error in signupSubmit: ")
    }
}
const verifyOtp = async(req, res) => {
    try{
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 420);
        }
        let verify = await verifyOTP(req.body.phno, req.body.otp)
        if (!verify) {
            return new ErrorResponse(res, constants.INVALID_OTP, 420)
        }
        return new SuccessResponse(res, { message: "success" })
    }
    catch(err){
        console.log("error in verifyOtp: ", err.message)
        return new ErrorResponse(res, "error in verifyOtp")
    }
}
const getOtp = async (req, res) => {
    try {
        let user = await userCollection.findOne({ phno: req.body.phno })
        if (_.isNil(user)) {
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 420);
        }
        // let otp = formOtp();
        // await userCollection.updateOne({ phno: req.body.phno }, { otp: otp })
        await sendOtp(req.body.phno, null)
        return new SuccessResponse(res, { message: 'Otp sent successfully' })
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
            return new ErrorResponse(res, constants.USER_NOT_FOUND, 420);
        }
        if (user.otp === req.body.otp) {
            return new SuccessResponse(res, { message: "success" })
        }
        else {
            return new ErrorResponse(res, constants.INVALID_OTP, 420)
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
    passwordChange,
    loginOtpSubmit,
    healthCheck,
    verifyOtp
}