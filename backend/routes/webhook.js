// routes/webhook.js

import express from 'express';
import stripe from 'stripe'; 
// Initialize Stripe here
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// This endpoint MUST use the raw body, which is configured in index.js
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Must be set in your .env

  let event;

  try {
    // Verify the event signature to ensure it's genuinely from Stripe
    event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: Signature verification failed.`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`[Stripe Webhook] PaymentIntent successful: ${paymentIntent.id}`);
      
      // *** CRITICAL ACTION: FULFILL ORDER ***
      // 1. Retrieve your order ID from paymentIntent.metadata
      // 2. Update the corresponding order status in your database (e.g., to 'Paid')
      // 3. Begin processing the order (e.g., send confirmation email)
      
      break;
      
    case 'payment_intent.payment_failed':
      // Handle failed payments
      break;
      
    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  // Acknowledge receipt of the event
  res.json({ received: true });
});

export default router;