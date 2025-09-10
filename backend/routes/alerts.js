const express = require("express");
const { getAllAlerts,deleteNotification, getJiraNotifications, getAssignAlerts, getAllAlertsByUserId } = require("../controllers/AlertsController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/alerts", getAllAlerts);
router.get("/alerts/byuserid",auth, getAllAlertsByUserId);
router.get("/alerts/assign",auth, getAssignAlerts);
router.delete("/alerts", deleteNotification);

module.exports = router;
