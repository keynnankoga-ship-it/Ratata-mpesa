// index.js
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend files from public/

// ===== STRIPE CARD PAYMENT =====
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Stripe secret key

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in KES cents
      currency: "kes",
      payment_method_types: ["card"],
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== M-PESA STK PUSH =====
// Example simulation; replace with Safaricom API for live payments
app.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;

  console.log(`STK Push initiated for phone ${phone}, amount KSh ${amount}`);

  // Here you would call Safaricom API for live payment
  // For now, we simulate success
  res.json({ message: "M-Pesa payment initiated" });
});

// ===== ORDER LOGGING =====
app.post("/order", (req, res) => {
  const order = req.body;
  console.log("Order received:", order);
  // Optionally store in DB
  res.json({ message: "Order saved successfully" });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Ratata backend running on port ${PORT}`));