import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/* ======================================================
   INIT RAZORPAY
====================================================== */
let razorpay;

try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  console.log("✅ Razorpay Initialized");
} catch (err) {
  console.error("❌ Razorpay Initialization Failed:", err);
}

/* ======================================================
   CREATE ORDER (PUBLIC)
====================================================== */
router.post('/create-order', async (req, res) => {
  try {
    console.log("📩 create-order BODY:", req.body);
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    };

    console.log("🔵 Creating Razorpay Order:", options);

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order
    });

  } catch (err) {
    console.error("❌ Order Creation Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
});

/* ======================================================
   VERIFY PAYMENT (NO SANITIZATION / NO AUTH)
====================================================== */
router.post('/verify', async (req, res) => {
  try {
    console.log("📩 verify BODY:", req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing verification parameters"
      });
    }

    // CORRECT secret key
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      console.log("Expected:", expectedSignature);
      console.log("Received:", razorpay_signature);

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    console.log("✅ Payment Verified!");

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Verification Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
