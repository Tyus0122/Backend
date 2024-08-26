const express = require('express')
const router = express.Router()
const { loginSubmit, login, signup, signupSubmit } = require('../controllers/authController')
const { validateToken, preventValidToken } = require('../middlewares/authMidware')
const {protectedRoute,Dashboard}=require('../controllers/DashboardController')
const {upload}=require("../middlewares/multer")

//Authorization
router.get('/login', preventValidToken, login)
router.get('/login', preventValidToken, signup)
router.post('/signup', preventValidToken, signupSubmit)
router.post('/loginSubmit', preventValidToken, loginSubmit)

//Protected routes
router.post('/protected', validateToken, upload.single('file') ,protectedRoute)
router.get('/dashboard', validateToken ,Dashboard)


module.exports = router