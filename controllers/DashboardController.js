const { SuccessResponse, ErrorResponse } = require('../helpers/response');
const userCollection = require("../models/user");
const postCollection = require("../models/post");
const notificationsCollection = require("../models/notifications");
const commentsCollection = require("../models/comments");
const _ = require('lodash')
const { constants, limitHelper } = require("../utils/constants")
const { uploadFile, getFileMetadata, mongoId, generateUniqueFileName } = require("../helpers/s3helper")
const { formatDateForComments } = require("../helpers/timehelper");
const commentsFormatHelper = (comments, logged_in_user_id) => {
    output = {
        comments: []
    }
    for (let comment of comments) {
        output.comments.push({
            _id: comment._id,
            pic: comment.pic,
            name: comment.name,
            comment: comment.comment,
            time: formatDateForComments(comment.time),
            city: comment.city,
            likes: _.isNil(comment.likes) ? 0 : comment.likes.length,
            liked: _.isNil(comment.likes) ? false : comment.likes.map(item => item.toString()).includes(logged_in_user_id.toString())
        })
    }
    output.isLastPage = output.comments.length < constants.PAGE_LIMIT ? true : false
    return output
}

const protectedRoute = async (req, res) => {
    await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype)
    return new SuccessResponse(res, { message: getFileMetadata(req.file) })
}


const Dashboard = async (req, res) => {
    return new SuccessResponse(res, { message: "dashboard" })
}

const postPost = async (req, res) => {
    try {
        const uploadedFiles = await Promise.all(
            req.files.map(async (file) => {
                const filename = generateUniqueFileName(file.originalname);
                await uploadFile(filename, file.buffer, file.mimetype);
                return getFileMetadata({ ...file, unqFileName: filename });
            })
        );
        req.body.peopleTagged = JSON.parse(req.body.peopleTagged);
        req.body.peopleTagged = req.body.peopleTagged.map((_id) => mongoId(_id));
        const result = await postCollection.create({
            city: req.body.city,
            peopleTagged: req.body.peopleTagged,
            date: req.body.date,
            time: req.body.time,
            caption: req.body.caption,
            files: uploadedFiles,
            posted_by: req.user._id
        });
        return new SuccessResponse(res, { message: result });
    } catch (err) {
        console.log("error in postPost: " + err.message);
        return new ErrorResponse(err, "error in postPost: ");
    }
};

const likePost = async (req, res) => {
    try {
        let post = await postCollection.findOne({ _id: mongoId(req.body.post_id) })
        let newnotification;
        if (req.body.liked && !post.likes.includes(req.user._id)) {
            post.likes.push(mongoId(req.user._id))
            post.likescount += 1
            newnotification = new notificationsCollection({
                notification_text: `${req.user.username} liked your post`,
                post_id: req.body.post_id,
                notification_raised_by: req.user._id,
                notification_for: post.posted_by
            })
        }
        else if (!req.body.liked && post.likes.includes(req.user._id)) {
            post.likescount -= 1
            post.likes = post.likes.filter(_id =>
                !_.isEqual(_id, req.user._id)
            );
            newnotification = new notificationsCollection({
                notification_text: `${req.user.username} disliked your post`,
                post_id: req.body.post_id,
                notification_raised_by: req.user._id,
                notification_for: post.posted_by
            })
        }
        await newnotification.save()
        await post.save()
        return new SuccessResponse(res, { message: "success" })
    }
    catch (err) {
        console.log("error in likePost: ", err.message)
        return new ErrorResponse(res, "error in likePost")
    }
}
const commentPost = async (req, res) => {
    try {
        const result = await commentsCollection.create({
            post_id: mongoId(req.body.post_id),
            comment: req.body.comment,
            parent_comment_id: req.body.parent_comment_id,
            commentedBy: req.user._id
        })
        const post = await postCollection.findOne({ _id: mongoId(req.body.post_id) })
        let newnotification = await notificationsCollection.create({
            notification_text: `${req.user.username} commented your post`,
            post_id: req.body.post_id,
            notification_raised_by: req.user._id,
            notification_for: post.posted_by
        })
        output = {
            _id: result._id,
            pic: req.user.pic,
            name: req.user.fullname,
            comment: req.body.comment,
            city: req.user.city,
            likes: 0,
            liked: false,
            time: formatDateForComments(result.createdAt)
        }
        return new SuccessResponse(res, { ...output })
    }
    catch (err) {
        console.log("error in commentPost: ", err.message)
        return new ErrorResponse(res, "error in commentPost")
    }
}
const getComments = async (req, res) => {
    try {
        let output = {
            comments: []
        }
        let commentsPipeline = [
            {
                $match: {
                    post_id: mongoId(req.query.post_id),
                    parent_comment_id: null
                }
            },
            {
                $sort: { createdAt: -1 },
            },
            ...limitHelper(req.query.page),
            {
                $lookup: {
                    from: "users",
                    localField: "commentedBy",
                    foreignField: "_id",
                    as: "result"
                }
            },
            {
                $unwind: {
                    path: "$result",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    pic: "$result.pic",
                    name: "$result.fullname",
                    comment: "$comment",
                    time: "$createdAt",
                    city: "$result.city",
                    likes: "$likes"
                }
            }
        ]
        let comments = await commentsCollection.aggregate(commentsPipeline)
        output = commentsFormatHelper(comments, req.user._id);
        return new SuccessResponse(res, { ...output })
    }
    catch (err) {
        console.log("error in getComments: ", err.message)
        return new ErrorResponse(res, "error in getComments")
    }
}
const getCommentReplies = async (req, res) => {
    try {
        let output = {
            comments: []
        }
        let commentsPipeline = [
            {
                $match: {
                    post_id: mongoId(req.query.postId),
                    parent_comment_id: mongoId(req.query.commentId)
                }
            },
            {
                $sort: { createdAt: -1 },
            },
            ...limitHelper(req.query.page),
            {
                $lookup: {
                    from: "users",
                    localField: "commentedBy",
                    foreignField: "_id",
                    as: "result"
                }
            },
            {
                $unwind: {
                    path: "$result",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    pic: "$result.pic",
                    name: "$result.fullname",
                    comment: "$comment",
                    time: "$createdAt",
                    city: "$result.city",
                    likes: "$likes"
                }
            }
        ]
        let comments = await commentsCollection.aggregate(commentsPipeline)
        output = commentsFormatHelper(comments, req.user._id);
        return new SuccessResponse(res, { ...output })
    }
    catch (err) {
        console.log("error in getComments: ", err.message)
        return new ErrorResponse(res, "error in getComments")
    }
}
const getPosts = async (req, res) => {
    let pipeline = [
        {
            $match: {
                posted_by: {
                    $ne: req.user._id
                }
            }
        },
        ...limitHelper(req.query.page)
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
        posts: [],
        logged_in_user: {}
    }
    let realcommentpipeline = [
        {
            $match: {
                post_id: {
                    $in: posts.map(post => post._id)
                },
                parent_comment_id: null,
            },
        },
        {
            $sort: { post_id: 1, createdAt: -1 },
        },
        {
            $group: {
                _id: "$post_id",
                comments: {
                    $push: {
                        _id: "$_id",
                        comment: "$comment",
                        commentedBy: "$commentedBy",
                        likes: "$likes",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                    },
                },
            },
        },
        {
            $addFields: {
                length: {
                    $size: "$comments", // Calculate the length of comments array
                },
            },
        },
        {
            $project: {
                comments: {
                    $slice: ["$comments", 0, constants.PAGE_LIMIT],
                },
                length: 1
            },
        },
        {
            $unwind: "$comments",
        },
        {
            $lookup: {
                from: "users",
                let: { userId: "$comments.commentedBy" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                    { $project: { _id: 1, fullname: 1, city: 1, pic: 1 } },
                ],
                as: "userDetails",
            },
        },
        {
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: "$_id",
                comments: {
                    $push: {
                        _id: "$comments._id",
                        comment: "$comments.comment",
                        commentedBy: "$comments.commentedBy",
                        likes: "$comments.likes",
                        createdAt: "$comments.createdAt",
                        name: "$userDetails.fullname",
                        city: "$userDetails.city",
                        pic: "$userDetails.pic"
                    },
                },
                length: {
                    $max: "$length"
                }
            },
        },
    ]
    let realcomments = await commentsCollection.aggregate(realcommentpipeline)
    realcomments = _.keyBy(realcomments, (comment) => comment._id.toString())
    _.forEach(posts, (post) => {
        const postIdString = post._id.toString();
        if (realcomments[postIdString]) {
            realcomments[postIdString].comments = commentsFormatHelper(realcomments[postIdString].comments, req.user._id);
        } else {
            realcomments[postIdString] = { comments: [] }; // If the post doesn't exist, initialize the comments as an empty array
        }
        liked = new Set(post.likes.map(liked => liked.toString()))
        output.posts.push({
            _id: post._id,
            saved: req.user.saved_posts.includes(mongoId(post._id)),
            posted_by_id: post.posted_by,
            posted_by: users[post.posted_by.toString()].username,
            posted_by_city: users[post.posted_by.toString()].city,
            pic: users[post.posted_by.toString()].pic.url,
            caption: post.caption,
            files: post.files,
            liked: liked.has(req.user._id.toString()),
            likescount: post.likescount,
            commentscount: realcomments[postIdString]?.length ?? 0,
            post_date: post.date,
            post_time: post.time,
            post_place: post.city,
        })
    })
    output.logged_in_user.pic = req.user.pic
    output.logged_in_user.name = req.user.fullname
    output.logged_in_user.city = req.user.city
    output.isLastPage = output.posts.length < constants.PAGE_LIMIT ? true : false
    output.comments = realcomments
    let shareUsersPipeline = [
        {
            $match: {
                _id: {
                    $ne: req.user._id
                }
            }
        },
        {
            $project: {
                _id: 1,
                pic: 1,
                city: 1,
                fullname: 1,
                username: 1
            }
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.shareUsers = await userCollection.aggregate(shareUsersPipeline)
    output.shareIsLastPage = output.shareUsers.length < constants.PAGE_LIMIT ? true : false
    output.sharePageLimit = constants.PAGE_LIMIT
    return new SuccessResponse(res, { message: output })
}
const getsinglepost = async (req, res) => {
    const pipeline = [
        {
            $match: {
                _id: mongoId(req.query.post)
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
        posts: [],
        logged_in_user: {}
    }
    let realcommentpipeline = [
        {
            $match: {
                post_id: {
                    $in: posts.map(post => post._id)
                },
                parent_comment_id: null,
            },
        },
        {
            $sort: { post_id: 1, createdAt: -1 },
        },
        {
            $group: {
                _id: "$post_id",
                comments: {
                    $push: {
                        _id: "$_id",
                        comment: "$comment",
                        commentedBy: "$commentedBy",
                        likes: "$likes",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                    },
                },
            },
        },
        {
            $addFields: {
                length: {
                    $size: "$comments", // Calculate the length of comments array
                },
            },
        },
        {
            $project: {
                comments: {
                    $slice: ["$comments", 0, constants.PAGE_LIMIT],
                },
                length: 1
            },
        },
        {
            $unwind: "$comments",
        },
        {
            $lookup: {
                from: "users",
                let: { userId: "$comments.commentedBy" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                    { $project: { _id: 1, fullname: 1, city: 1, pic: 1 } },
                ],
                as: "userDetails",
            },
        },
        {
            $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: "$_id",
                comments: {
                    $push: {
                        _id: "$comments._id",
                        comment: "$comments.comment",
                        commentedBy: "$comments.commentedBy",
                        likes: "$comments.likes",
                        createdAt: "$comments.createdAt",
                        name: "$userDetails.fullname",
                        city: "$userDetails.city",
                        pic: "$userDetails.pic"
                    },
                },
                length: {
                    $max: "$length"
                }
            },
        },
    ]
    let realcomments = await commentsCollection.aggregate(realcommentpipeline)
    realcomments = _.keyBy(realcomments, (comment) => comment._id.toString())
    _.forEach(posts, (post) => {
        const postIdString = post._id.toString();
        if (realcomments[postIdString]) {
            realcomments[postIdString].comments = commentsFormatHelper(realcomments[postIdString].comments, req.user._id);
        } else {
            realcomments[postIdString] = { comments: [] }; // If the post doesn't exist, initialize the comments as an empty array
        }
        liked = new Set(post.likes.map(liked => liked.toString()))
        output.posts.push({
            _id: post._id,
            saved: req.user.saved_posts.includes(mongoId(post._id)),
            posted_by_id: post.posted_by,
            posted_by: users[post.posted_by.toString()].username,
            posted_by_city: users[post.posted_by.toString()].city,
            pic: users[post.posted_by.toString()].pic.url,
            caption: post.caption,
            files: post.files,
            liked: liked.has(req.user._id.toString()),
            likescount: post.likescount,
            commentscount: realcomments[postIdString]?.length ?? 0,
            post_date: post.date,
            post_time: post.time,
            post_place: post.city,
        })
    })
    output.logged_in_user.pic = req.user.pic
    output.logged_in_user.name = req.user.fullname
    output.logged_in_user.city = req.user.city
    output.isLastPage = output.posts.length < constants.PAGE_LIMIT ? true : false
    output.comments = realcomments
    let shareUsersPipeline = [
        {
            $match: {
                _id: {
                    $ne: req.user._id
                }
            }
        },
        {
            $project: {
                _id: 1,
                pic: 1,
                city: 1,
                fullname: 1,
                username: 1
            }
        },
        {
            $limit: constants.PAGE_LIMIT
        }
    ]
    output.shareUsers = await userCollection.aggregate(shareUsersPipeline)
    output.shareIsLastPage = output.shareUsers.length < constants.PAGE_LIMIT ? true : false
    output.sharePageLimit = constants.PAGE_LIMIT
    return new SuccessResponse(res, { message: output })
}
const likeComment = async (req, res) => {
    try {
        let output = {
            message: ''
        }
        let comment = await commentsCollection.findOne({ _id: mongoId(req.body.comment_id) })
        if (req.body.liked && !comment.likes?.includes(req.user._id)) {
            comment.likes.push(mongoId(req.user._id))
        }
        else if (!req.body.liked && comment.likes?.includes(req.user._id)) {
            comment.likes = comment.likes.filter(_id =>
                !_.isEqual(_id, req.user._id)
            );
        }
        await comment.save()
        output.message = "comment liked successfully"
        return new SuccessResponse(res, { ...output })
    }
    catch (err) {
        console.log("error in likeComment: " + err.message);
        return new ErrorResponse(res, "error in likeComment: ");
    }
}
const savePost = async (req, res) => {
    let output = {}
    if (req.body.saved) {
        if (_.isNil(req.user.saved_posts)) {
            req.user.saved_posts = [mongoId(req.body.post_id)]
        }
        else if (!req.user.saved_posts.includes(mongoId(req.body.post_id))) {
            req.user.saved_posts.push(mongoId(req.body.post_id))
        }
    }
    else {
        if (_.isNil(req.user.saved_posts)) {
            req.user.saved_posts = []
        }
        else if (req.user.saved_posts.includes(mongoId(req.body.post_id))) {
            req.user.saved_posts = req.user.saved_posts.filter(post => post.toString() !== mongoId(req.body.post_id).toString())
        }
    }
    await req.user.save()
    return new SuccessResponse(res, output)
}
const getSavedPosts = async (req, res) => {
    let output = {}
    postPipeline = [
        {
            $match: {
                _id: { $in: req.user.saved_posts }
            },
        },
        {
            $project: {
                files: {
                    $arrayElemAt: ["$files", 0]
                }
            }
        },
        ...limitHelper(req.query.page)
    ]
    output.posts = await postCollection.aggregate(postPipeline)
    return new SuccessResponse(res, { ...output })
}
module.exports = {
    protectedRoute,
    Dashboard,
    postPost,
    likePost,
    commentPost,
    getPosts,
    getsinglepost,
    savePost,
    getComments,
    likeComment,
    getCommentReplies,
    getSavedPosts
}   