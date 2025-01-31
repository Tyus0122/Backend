process.removeAllListeners('warning');
const dotenv = require("dotenv").config()
const connectDb = require("./config/mongoose");
const express = require("express");
const app = express();
let cors = require('cors');
// CORS Middleware (Fixing Potential CORS Issues)
app.use(cors({ 
    origin: "*", // Allow all origins (change to specific frontend URL in production)
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
const bodyparser = require("body-parser")
const session = require("express-session")
app.use(bodyparser.json({ limit: '50mb' }))
app.use(bodyparser.urlencoded({ limit: '50mb', extended: true }))
app.use(session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true
}))
connectDb();
const routes=require("./routes/routes")

app.use("/v1/user",routes)


const server = app.listen(3040, (req, res) => {
    console.log("listening on http://localhost:3040")
})