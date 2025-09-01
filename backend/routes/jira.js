const express = require("express")

const { auth } = require("../middleware/auth")
const { callJiraConnectAPI,markJiraAlertRead,updateAlertStatus, getAllJiraIssues, getJiraCredentials, getJiraIssueById, updateIssueStatus } = require("../controllers/JiraController")
const router = express.Router()

router.get("/jira/credentials",auth,getJiraCredentials)
router.post("/jira/connect",auth,callJiraConnectAPI)
router.get("/jira/issues",auth,getAllJiraIssues)
router.get("/jira/issues/:id",auth,getJiraIssueById)
router.post("/jira/approve", updateIssueStatus);
// Approve/Reject Jira Alert
router.put("/jira/alert/status", updateAlertStatus);

// Mark Jira Alert as Read
router.put("/jira/alert/read", markJiraAlertRead);

module.exports = router
