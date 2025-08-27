const express = require("express");
const { globalSearch } = require("../controllers/searchController");

const router = express.Router();

router.post("/search", globalSearch);

module.exports = router;
