const crypto = require('crypto');

/**
 * Verify Razorpay payment signature securely on backend
 * signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
  if (!orderId || !paymentId || !signature) return false;
  
  const generatedSignature = crypto
    .createHmac('sha256', secret || process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_67890')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = { verifyRazorpaySignature };
