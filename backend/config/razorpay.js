const Razorpay = require('razorpay');

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'rzp_test_your_key_id') {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('[Razorpay] Failed to initialize Razorpay SDK:', err.message);
  }
}

module.exports = razorpayInstance;
