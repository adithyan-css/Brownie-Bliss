const express = require('express');
const router = express.Router();
const { login } = require('../controllers/adminController');
const validate = require('../middlewares/validate');
const { adminLoginSchema } = require('../validators/adminValidator');

router.post('/login', validate(adminLoginSchema), login);

module.exports = router;
