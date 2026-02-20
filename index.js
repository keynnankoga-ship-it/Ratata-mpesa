const express = require("express");
const path = require("path");
const app = express();

// API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "API working 🚀" });
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Catch-all route for frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Ratata server running on port ${PORT}`));