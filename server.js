const express = require("express");
const verifyEmail = require("./verifyEmail");

const app = express();

app.use(express.static("public"));

app.get("/verify", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.json({ error: "Email parameter required" });
  }

  const result = await verifyEmail(email);
  res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});