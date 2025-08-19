const express = require("express")

const { auth } = require("../middleware/auth")
const { callJiraConnectAPI, getAllJiraIssues, getJiraCredentials, getJiraIssueById } = require("../controllers/JiraController")
const router = express.Router()

router.get("/jira/credentials",auth,getJiraCredentials)
router.post("/jira/connect",auth,callJiraConnectAPI)
router.get("/jira/issues",auth,getAllJiraIssues)
router.get("/jira/issues/:id",auth,getJiraIssueById)

module.exports = router
