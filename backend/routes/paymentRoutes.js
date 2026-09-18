const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, submitUpiPayment, getMyPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createOrder);
router.post('/submit-upi', protect, submitUpiPayment);
router.post('/verify', protect, verifyPayment);
router.get('/my', protect, getMyPayments);

module.exports = router;
