const express = require("express");
const { createComplaint } = require("../controllers/complaintController");

const router = express.Router();

router.post("/", createComplaint);

module.exports = router;