const express = require('express');
const router = express.Router();
const { getPool } = require('../db');
const auth = require('../middleware/auth');

// GET /api/customer/viewall
router.get('/viewall', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM customers");

    res.json(result.recordset);
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
