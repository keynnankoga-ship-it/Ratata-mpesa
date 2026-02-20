require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

/* =========================
   FRONTEND STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   TEST BACKEND ROUTE
========================= */
app.get("/api/hello", (req, res) => {
  res.json({ message: "API working 🚀" });
});

/* =========================
   CATCH-ALL ROUTE (FRONTEND)
========================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));