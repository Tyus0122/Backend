const express = require('express')
const router = express.Router()
const { loginSubmit, login, signup, signupSubmit, getOtp, postOtp, passwordChange } = require('../controllers/authController')
const { validateToken, preventValidToken } = require('../middlewares/authMidware')
const { protectedRoute, Dashboard, postPost, likePost, commentPost, getPosts, getsinglepost } = require('../controllers/DashboardController')
const { sendConnectionRequest, acceptConnectionRequest, getUsers, getLoggedInUser, getLoggedInUserPosts, getUserProfile, getUserPosts, editProfilePost } = require('../controllers/UserController')
const { postProfileMessage, getMessages, postMessages, getConversations } = require('../controllers/chatController')
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
router.get('/getPosts', validateToken, getPosts)
router.get('/getsinglepost', validateToken, getsinglepost)

//user routes
router.post('/sendConnectionRequest', validateToken, sendConnectionRequest)
router.post('/acceptConnectionRequest', validateToken, acceptConnectionRequest)
router.get('/getUsers', validateToken, getUsers)
router.get('/getLoggedInUser', validateToken, getLoggedInUser)
router.get('/getUserProfile', validateToken, getUserProfile)
router.get('/getLoggedInUserPosts', validateToken, getLoggedInUserPosts)
router.get('/getUserPosts', validateToken, getUserPosts)
router.post('/editProfilePost', validateToken, upload.single('file'), editProfilePost)




//chat toutes
router.post('/postProfileMessage', validateToken, postProfileMessage)
router.get('/getMessages', validateToken, getMessages)
router.get('/getConversations', validateToken, getConversations)
router.post('/postMessages', validateToken, postMessages)



module.exports = router