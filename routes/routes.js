const express = require('express')
const router = express.Router()
const { loginSubmit, login, signup, signupSubmit, getOtp, postOtp, passwordChange } = require('../controllers/authController')
const { validateToken, preventValidToken } = require('../middlewares/authMidware')
const { protectedRoute, Dashboard, postPost, likePost ,commentPost,getPosts} = require('../controllers/DashboardController')
const {sendConnectionRequest,acceptConnectionRequest } = require('../controllers/UserController')
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
router.post('/postPost', validateToken, upload.single('file'), postPost)
router.get('/dashboard', validateToken, Dashboard)
router.post('/likePost', validateToken, likePost)
router.post('/commentPost', validateToken, commentPost)
router.get('/getPosts', validateToken, getPosts)

//user routes
router.post('/sendConnectionRequest', validateToken, sendConnectionRequest)
router.post('/acceptConnectionRequest', validateToken, acceptConnectionRequest)


module.exports = router