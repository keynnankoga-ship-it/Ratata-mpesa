require("dotenv").config({ path: __dirname + '/.env' });
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  SHORTCODE,
  PASSKEY,
  CALLBACK_URL
} = process.env;

// Debug: confirm environment variables loaded
console.log("CONSUMER_KEY:", CONSUMER_KEY ? "Loaded" : "Missing");
console.log("CONSUMER_SECRET:", CONSUMER_SECRET ? "Loaded" : "Missing");
console.log("SHORTCODE:", SHORTCODE ? "Loaded" : "Missing");
console.log("PASSKEY:", PASSKEY ? "Loaded" : "Missing");

// Generate Safaricom access token
async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

// STK Push route
app.post("/stkpush", async (req, res) => {
  const { phone, amount } = req.body;

  // Validate inputs
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount are required." });
  }
  if (!/^\d{12}$/.test(phone)) {
    return res.status(400).json({ error: "Phone must be 12 digits starting with 254." });
  }
  if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Amount must be a positive integer." });
  }

  try {
    const token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = Buffer.from(SHORTCODE + PASSKEY + timestamp).toString("base64");

    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "Ratata",
        TransactionDesc: "Ratata Payment"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ message: "STK Push sent successfully!", data: stkResponse.data });

  } catch (err) {
    console.log("FULL SAFARICOM ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
