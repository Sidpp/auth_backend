const express = require("express");
const { getAllAlerts,deleteNotification, getJiraNotifications } = require("../controllers/AlertsController");

const router = express.Router();

router.get("/alerts", getAllAlerts);
router.delete("/alerts", deleteNotification);

module.exports = router;
