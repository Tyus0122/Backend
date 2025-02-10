const express = require('express')
const router = express.Router()
const { verifyOtp, loginOtpSubmit, loginSubmit, login, signup, signupSubmit, getOtp, postOtp, passwordChange, healthCheck } = require('../controllers/authController')
const { validateToken, preventValidToken } = require('../middlewares/authMidware')
const { postEditPost, getEditPost, deletePost, turnComments, protectedRoute, Dashboard, postPost, likePost, getCommentReplies, commentPost, getPosts, getHomePosts, getsinglepost, savePost, getComments, likeComment, getSavedPosts } = require('../controllers/DashboardController')
const { getNotifications, getSuggestions, getRequests, getLastDays } = require('../controllers/notificationsController')
const { changeCurrentPassword, removeConnection, getBlockedUsers, blockUser, rejectConnectionRequest, sendConnectionRequest, shareProfleUsers, acceptConnectionRequest, getUsers, getLoggedInUser, getLoggedInUser_id, getLoggedInUserPosts, getUserProfile, getUserPosts, editProfilePost } = require('../controllers/UserController')
const { getAllMessages, deleteConversation, postProfileMessage, getMessages, postMessages, getConversations, sharePostService, shareProfileService } = require('../controllers/chatController')
const { creategetAdminChat, getUsersForAdmin, getAdminMessages, sendAdminMessage, reportUser, getAdminUserList } = require('../controllers/adminController')
const { upload } = require("../middlewares/multer")


//admin routes
router.get('/creategetAdminChat', validateToken, creategetAdminChat)
router.get('/healthCheck', healthCheck)
router.get('/getUsersForAdmin', getUsersForAdmin)
router.get('/getAdminUserList', getAdminUserList)
router.get('/getAdminMessages', getAdminMessages)
router.post('/sendAdminMessage', sendAdminMessage)
router.post('/reportUser', validateToken, reportUser)
router.post('/verifyOtp', preventValidToken, verifyOtp)
//Authorization
router.get('/login', preventValidToken, login)
router.get('/login', preventValidToken, signup)
router.post('/getOtp', preventValidToken, getOtp)
router.post('/signup', preventValidToken, signupSubmit)
router.post('/postOtp', preventValidToken, postOtp)
router.post('/loginOtpSubmit', preventValidToken, loginOtpSubmit)
router.post('/loginSubmit', preventValidToken, loginSubmit)
router.post('/changePassword', preventValidToken, passwordChange)

//Dashboard routes
router.post('/protected', validateToken, upload.single('file'), protectedRoute)
router.post('/postPost', validateToken, upload.array('files'), postPost)
router.post('/postEditPost', validateToken, upload.array('files'), postEditPost)
router.get('/dashboard', validateToken, Dashboard)
router.post('/likePost', validateToken, likePost)
router.post('/commentPost', validateToken, commentPost)
router.get('/getComments', validateToken, getComments)
router.get('/getCommentReplies', validateToken, getCommentReplies)
router.get('/getPosts', validateToken, getPosts)
router.get('/getHomePosts', validateToken, getHomePosts)
router.get('/getSavedPosts', validateToken, getSavedPosts)
router.get('/shareProfleUsers', validateToken, shareProfleUsers)
router.get('/getsinglepost', validateToken, getsinglepost)
router.post('/savePost', validateToken, savePost)
router.post('/likeComment', validateToken, likeComment)
router.post('/turnComments', validateToken, turnComments)
router.post('/deletePost', validateToken, deletePost)
router.get('/getEditPost', validateToken, getEditPost)

//user routes
router.post('/sendConnectionRequest', validateToken, sendConnectionRequest)
router.post('/acceptConnectionRequest', validateToken, acceptConnectionRequest)
router.post('/rejectConnectionRequest', validateToken, rejectConnectionRequest)
router.get('/getUsers', validateToken, getUsers)
router.get('/getLoggedInUser', validateToken, getLoggedInUser)
router.get('/getLoggedInUser_id', validateToken, getLoggedInUser_id)
router.get('/getUserProfile', validateToken, getUserProfile)
router.get('/getLoggedInUserPosts', validateToken, getLoggedInUserPosts)
router.get('/getUserPosts', validateToken, getUserPosts)
router.post('/editProfilePost', validateToken, upload.single('file'), editProfilePost)
router.post('/sharePostService', validateToken, sharePostService)
router.post('/shareProfileService', validateToken, shareProfileService)
router.post('/blockUser', validateToken, blockUser)
router.get('/getBlockedUsers', validateToken, getBlockedUsers)
router.post('/changeCurrentPassword', validateToken, changeCurrentPassword)
router.post('/removeConnection', validateToken, removeConnection)



//chat toutes
router.post('/postProfileMessage', validateToken, postProfileMessage)
router.get('/getMessages', validateToken, getMessages)
router.get('/getAllMessages', validateToken, getAllMessages)
router.get('/getConversations', validateToken, getConversations)
router.post('/postMessages', validateToken, postMessages)
router.post('/deleteConversation', validateToken, deleteConversation)



//notifications routes
router.get('/getNotifications', validateToken, getNotifications)
router.get('/getSuggestions', validateToken, getSuggestions)
router.get('/getRequests', validateToken, getRequests)
router.get('/getLastDays', validateToken, getLastDays)


module.exports = router