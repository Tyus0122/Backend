const {SuccessResponse,ErrorResponse} =require('../helpers/response');
const jwt = require("jsonwebtoken");
const _= require('lodash');
const constants = require('../utils/constants');
const validateToken = async (req, res, next) => {
    token = req.headers['authorization']
    if (_.isNil(token) || !token.startsWith('Bearer ')) {
        return new ErrorResponse(res,constants.UNAUTHORIZED,403)
    }
    token=token.split(" ")[1]
    jwt.verify(token, process.env.USER_SECRET, (async (err, decoded) => {
        if (err) {
            return new ErrorResponse(res,err.message,403)
        }
        req.user = decoded.obj
        return next();
    }))
}


const preventValidToken=async (req, res,next) => {
    token=req.headers['authorization']
    if(_.isNil(token) ){
        return next()
    }
    token=token.split(" ")[1]
    jwt.verify(token, process.env.USER_SECRET, (async (err, decoded) => {
        if (err) {
            return next()
        }
        return new ErrorResponse(res,constants.UNAUTHORIZED,403);
    }))
}
module.exports = {
    validateToken,
    preventValidToken
};

