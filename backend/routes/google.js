const express = require("express")
const { getAllGoogleDetails, getGoogleSheetById, getGoogleCredentials } = require("../controllers/GoogleController")
const {auth} = require("../middleware/auth")
const router = express.Router()


router.get("/google/credentials",auth,getGoogleCredentials)
router.get("/google",auth,getAllGoogleDetails)
router.get("/google/:id",getGoogleSheetById)



module.exports = router
