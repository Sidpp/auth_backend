const express = require("express")
const { auth } = require("../middleware/auth")
const { callJiraConnectAPI,markJiraAlertRead,updateAlertStatus, getAllJiraIssues, getJiraCredentials, getJiraIssueById, updateIssueStatus, getJiraIssuesByIds, getAssignJiraIssues } = require("../controllers/JiraController")
const router = express.Router()


router.get("/jira/credentials",auth,getJiraCredentials)
router.post("/jira/connect",auth,callJiraConnectAPI)
router.get("/jira/issues",auth,getAllJiraIssues)
//get assign issues
router.post("/jira/issues/assigned",getAssignJiraIssues)
router.get("/jira/issues/:id",getJiraIssueById)
router.get("/jira/issuesids",getJiraIssuesByIds)
//for ai summry
router.post("/jira/approve", updateIssueStatus);
// Approve/Reject Jira Alert
router.put("/jira/alert/status", updateAlertStatus);

// Mark Jira Alert as Read
router.put("/jira/alert/read", markJiraAlertRead);

module.exports = router
