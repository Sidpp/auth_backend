const express = require("express");
const { createFeedback } = require("../controllers/FeedBackController");
const router = express.Router();

router.post("/feedback", createFeedback);

module.exports = router;
