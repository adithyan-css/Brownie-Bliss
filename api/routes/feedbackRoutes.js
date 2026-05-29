const express = require('express');
const router = express.Router();
const { submitReview, submitComplaint, getReviews } = require('../controllers/feedbackController');

router.post('/review', submitReview);
router.post('/complaint', submitComplaint);
router.get('/reviews', getReviews);

module.exports = router;
