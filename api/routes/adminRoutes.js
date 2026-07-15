const express = require("express");
const router = express.Router();
const { login } = require("../controllers/adminController");
const { adminLoginLimiter } = require("../middlewares/adminLoginLimiter");

router.post("/login", adminLoginLimiter, login);

module.exports = router;
