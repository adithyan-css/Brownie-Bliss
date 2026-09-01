const express = require("express");
const { createFeedback } = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", createFeedback);

module.exports = router;