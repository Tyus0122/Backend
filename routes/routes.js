const express = require('express')
const router = express.Router()
const { loginSubmit, login, signup, signupSubmit, getOtp, postOtp, passwordChange } = require('../controllers/authController')
const { validateToken, preventValidToken } = require('../middlewares/authMidware')
const { protectedRoute, Dashboard, postPost, likePost, getCommentReplies, commentPost, getPosts, getsinglepost, savePost, getComments, likeComment, getSavedPosts } = require('../controllers/DashboardController')
const { getNotifications } = require('../controllers/notificationsController')
const { rejectConnectionRequest, sendConnectionRequest, shareProfleUsers, acceptConnectionRequest, getUsers, getLoggedInUser, getLoggedInUser_id, getLoggedInUserPosts, getUserProfile, getUserPosts, editProfilePost } = require('../controllers/UserController')
const { postProfileMessage, getMessages, postMessages, getConversations, sharePostService, shareProfileService } = require('../controllers/chatController')
const { upload } = require("../middlewares/multer")

//Authorization
router.get('/login', preventValidToken, login)
router.get('/login', preventValidToken, signup)
router.post('/getOtp', preventValidToken, getOtp)
router.post('/signup', preventValidToken, signupSubmit)
router.post('/postOtp', preventValidToken, postOtp)
router.post('/loginSubmit', preventValidToken, loginSubmit)
router.post('/changePassword', preventValidToken, passwordChange)

//Dashboard routes
router.post('/protected', validateToken, upload.single('file'), protectedRoute)
router.post('/postPost', validateToken, upload.array('files'), postPost)
router.get('/dashboard', validateToken, Dashboard)
router.post('/likePost', validateToken, likePost)
router.post('/commentPost', validateToken, commentPost)
router.get('/getComments', validateToken, getComments)
router.get('/getCommentReplies', validateToken, getCommentReplies)
router.get('/getPosts', validateToken, getPosts)
router.get('/getSavedPosts', validateToken, getSavedPosts)
router.get('/shareProfleUsers', validateToken, shareProfleUsers)
router.get('/getsinglepost', validateToken, getsinglepost)
router.post('/savePost', validateToken, savePost)
router.post('/likeComment', validateToken, likeComment)

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




//chat toutes
router.post('/postProfileMessage', validateToken, postProfileMessage)
router.get('/getMessages', validateToken, getMessages)
router.get('/getConversations', validateToken, getConversations)
router.post('/postMessages', validateToken, postMessages)



//notifications routes
router.get('/getNotifications', validateToken, getNotifications)

module.exports = router