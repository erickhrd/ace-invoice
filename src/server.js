require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Public (no auth)
app.use('/api/public', require('./routes/public'));

// Protected (with API key)
app.use('/api/customer', require('./routes/customers'));
app.use('/api/product', require('./routes/products'));
app.use('/api/order', require('./routes/orders'));

// 404 handler
app.use((req, res) => {
  res.status(404).send("Endpoint not found")
});

app.listen(3000, () => console.log("API running on port 3000"));
