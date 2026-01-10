const express = require("express");
const router = express.Router();

// GET /api/public/hello
router.get("/hello", (req, res) => {
  res.send("API Online & Available...")
});

module.exports = router;
