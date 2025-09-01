const express = require("express")
const { getAllGoogleDetails,markGoogleAlertRead,updateGoogleAlertStatus, getGoogleSheetById, getGoogleCredentials, updateGoogleIssueStatus } = require("../controllers/GoogleController")
const {auth} = require("../middleware/auth")
const router = express.Router()

router.post("/google/approve", updateGoogleIssueStatus);
router.get("/google/credentials",auth,getGoogleCredentials)
router.get("/google",auth,getAllGoogleDetails)
router.get("/google/:id",getGoogleSheetById)

// Approve/Reject Google Alert
router.put("/google/alert/status", updateGoogleAlertStatus);

// Mark Google Alert as Read
router.put("/google/alert/read", markGoogleAlertRead);



module.exports = router
