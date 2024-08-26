const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const jwt = require("jsonwebtoken")
const userCollection = require("../models/user");
const _ = require('lodash')
const { constants } = require("../utils/constants")
const bcrypt = require('bcrypt');

const loginSubmit = async (req, res) => {
    const user = await userCollection.findOne({email: req.body.email});
    if (_.isEqual(user, [])) {
        return new ErrorResponse(res, constants.USER_NOT_FOUND, 404)
    }
    const isMatch =await bcrypt.compare(req.body.password, user.hashPassword);
    if(!isMatch){
        return new ErrorResponse(res, constants.USER_NOT_FOUND, 404)
    }
    obj = {
        _id: user._id
    }
    const accessToken = jwt.sign({ obj }, process.env.USER_SECRET, { expiresIn: "12h" })
    return new SuccessResponse(res, { BearerToken: accessToken });
}

const login = async (req, res) => {
    return new SuccessResponse(res, { message: "login" });
}

const signup = async (req, res) => {
    return new SuccessResponse(res, { message: "signup" });
}

const signupSubmit = async (req, res) => {
    let user=await userCollection.findOne({email: req.body.email})
    if(!_.isNil(user)){
        return new ErrorResponse(res, constants.USER_ALREADY_EXISTS,201);
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


module.exports = {
    loginSubmit,
    login,
    signupSubmit,
    signup,
}