// ================================
// 1️⃣ IMPORT DEPENDENCIES
// ================================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");

const User = require("./models/User"); // MongoDB model

// ================================
// 2️⃣ INITIALIZE APP
// ================================
const app = express();

// ================================
// 3️⃣ MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// ================================
// 4️⃣ CONNECT TO MONGODB
// ================================
async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;

    await mongoose.connect(mongoURI, {
      connectTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected Successfully");

  } catch (err) {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);

    if (err instanceof mongoose.Error.MongooseServerSelectionError) {
      console.error(
        "⚠️ Could not reach Atlas. Check:\n" +
        "1. Your IP is whitelisted in Atlas\n" +
        "2. Your username/password is correct\n" +
        "3. Your database name is correct\n"
      );
    }

    process.exit(1);
  }
}

connectDB();

// ================================
// 5️⃣ TEST DATABASE CONNECTION
// ================================
app.get("/test-db", async (req, res) => {
  try {
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 6️⃣ SAVE USER
// ================================
app.post("/api/users", async (req, res) => {
  try {

    const user = new User(req.body);

    await user.save();

    console.log("✅ User saved:", user);

    res.json({
      message: "User saved successfully",
      user
    });

  } catch (err) {

    console.error("❌ User save error:", err);

    res.status(500).json({
      error: err.message
    });

  }
});

// ================================
// 7️⃣ STRIPE PAYMENT
// ================================
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {

  const { amount } = req.body;

  try {

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "kes",
      payment_method_types: ["card"],
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (err) {

    console.error("Stripe Error:", err);

    res.status(500).json({
      error: err.message
    });

  }
});

// ================================
// 8️⃣ M-PESA TOKEN
// ================================
async function getMpesaToken() {

  const auth = Buffer.from(
    process.env.MPESA_CONSUMER_KEY +
    ":" +
    process.env.MPESA_CONSUMER_SECRET
  ).toString("base64");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`
      },
    }
  );

  return response.data.access_token;

}

// ================================
// 9️⃣ M-PESA STK PUSH
// ================================
app.post("/stkpush", async (req, res) => {

  const { phone, amount } = req.body;

  try {

    const token = await getMpesaToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE +
      process.env.MPESA_PASSKEY +
      timestamp
    ).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: "Ratata",
        TransactionDesc: "Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
      }
    );

    console.log("✅ MPESA RESPONSE:", response.data);

    res.json(response.data);

  } catch (err) {

    console.error("❌ MPESA ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: "STK Push failed"
    });

  }
});

// ================================
// 🔟 ORDER ROUTE (SAVE TO DB)
// ================================
app.post("/order", async (req, res) => {

  try {

    const orderData = req.body;

    const order = new User({
      name: orderData.name,
      email: orderData.email,
      phone: orderData.phone
    });

    await order.save();

    console.log("🧾 Order saved:", order);

    res.json({
      message: "Order saved successfully",
      order
    });

  } catch (err) {

    console.error("❌ Order save error:", err);

    res.status(500).json({
      error: err.message
    });

  }

});

// ================================
// 1️⃣1️⃣ SERVE FRONTEND (RENDER SAFE)
// ================================
app.get("*", (req, res) => {

  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );

});

// ================================
// 1️⃣2️⃣ START SERVER
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`🚀 Ratata backend running on port ${PORT}`);

});