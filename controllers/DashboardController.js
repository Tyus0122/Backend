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


const Dashboard = async (req, res) => {
    return new SuccessResponse(res, { message: "dashboard" })
}

const postPost = async (req, res) => {
    try {
        await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
        let file = getFileMetadata(req.file)
        req.body.peopleTagged = JSON.parse(req.body.peopleTagged)
        req.body.peopleTagged.map((_id) => mongoId(_id))
        const result = await postCollection.create({
            city: req.body.city,
            peopleTagged: req.body.peopleTagged,
            date: req.body.date,
            time: req.body.time,
            caption: req.body.caption,
            file: {
                url: file.url,
                size: file.size,
                mimeType: file.mimeType,
            },
            posted_by: req.user._id
        })
        return new SuccessResponse(res, { message: req.user })
    }
    catch (err) {
        console.log("error in postPost: " + err.message)
        return new ErrorResponse(err, "error in postPost: ")
    }
}
const likePost = async (req, res) => {
    try {

        let post = await postCollection.findOne({ _id: mongoId(req.body.post_id) })
        if (req.body.liked && !post.likes.includes(req.user._id)) {
            post.likes.push(mongoId(req.user._id))
            post.likescount += 1
        }
        else if (!req.body.liked && post.likes.includes(req.user._id)) {
            post.likescount -= 1
            post.likes = post.likes.filter(_id =>
                !_.isEqual(_id, req.user._id)
            );
        }
        await post.save()
        return new SuccessResponse(res, { message: "success" })
    }
    catch (err) {
        console.log("error in likePost: ", err.message)
        return new ErrorResponse(err, "error in likePost")
    }
}
const commentPost = async (req, res) => {
    try {

        const result = await commentsCollection.create({
            post_id: mongoId(req.body.post_id),
            comment: req.body.comment,
            replyfor: req.body.replyfor,
            commentedBy: req.user._id
        })
        return new SuccessResponse(res, { message: req.body })
    }
    catch (err) {
        console.log("error in commentPost: ", err.message)
        return new ErrorResponse(res, "error in commentPost")
    }
}
const getPosts = async (req, res) => {
    let pipeline = [
        {
            $match: {
                posted_by: {
                    $in: req.user.connections
                }
            }
        }
    ]
    let posts = await postCollection.aggregate(pipeline)
    let userids = posts.map(post => post.posted_by)
    let userpipeline = [
        {
            $match: {
                _id: {
                    $in: userids
                }
            }
        }
    ]
    let users = await userCollection.aggregate(userpipeline)
    users = _.keyBy(users, (user) => user._id.toString())
    let output = {
        posts: []
    }
    let commentpipeline = [
        {
            $match: {
                post_id: {
                    $in: posts.map(post => post._id)
                }
            }
        },
        {
            $group: {
                _id: "$post_id",
                arr: {
                    $push: {
                        commentedBy: "$commentedBy"
                    }
                }
            }
        },
        {
            $addFields: {
                comments_count: {
                    $size: "$arr"
                }
            }
        },
    ]
    let comments = await commentsCollection.aggregate(commentpipeline)
    _.forEach(comments, (comment) => {
        comment.commentedByName = new Set()
        _.forEach(comment.arr, (_id) => {
            comment.commentedByName.add(users[_id.commentedBy.toString()].fullname)
        })
    })
    let commentscount = _.keyBy(comments, (comment) => comment._id.toString())
    _.forEach(posts, (post) => {
        liked = new Set(post.likes.map(liked => liked.toString()))
        output.posts.push({
            posted_by: users[post.posted_by.toString()].username,
            posted_by_city: users[post.posted_by.toString()].city,
            pic: users[post.posted_by.toString()].pic.url,
            caption: post.caption,
            photo: post.file.url,
            liked: liked.has(req.user._id.toString()),
            likescount: post.likescount,
            commentscount: commentscount[post._id.toString()].comments_count,
            post_date: post.date,
            post_time: post.time,
            post_place:post.city
        })
    })
    return new SuccessResponse(res, { message: output })
}
module.exports = {
    protectedRoute,
    Dashboard,
    postPost,
    likePost,
    commentPost,
    getPosts
}   