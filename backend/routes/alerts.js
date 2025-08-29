const express = require("express");
const { getAllAlerts,deleteNotification, getJiraNotifications } = require("../controllers/AlertsController");

const router = express.Router();

router.get("/alerts", getAllAlerts);
// router.get("/alerts/jira", getJiraNotifications);
router.delete("/alerts", deleteNotification);

module.exports = router;
