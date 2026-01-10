const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const auth = require("../middleware/auth");

// POST /api/order/new

router.post("/new", auth, async (req, res) => {
    console.log("BODY:", req.body);

  const { invoiceData, products } = req.body;

  if (
    !invoiceData ||
    !invoiceData.customerId ||
    !Array.isArray(products) ||
    products.length === 0
  ) {
    return res.status(400).send("Invalid input data");
  }

  for (const p of products) {
    if (!p.productId || !Number.isInteger(p.quantity) || p.quantity <= 0) {
      return res.status(400).send("Invalid product data");
    }
  }

  const pool = await getPool();
  const transaction = pool.transaction();
  let transactionStarted = false;

  try {
    await transaction.begin();
    transactionStarted = true;
    // Insert order
    const orderResult = await transaction
      .request()
      .input("customerId", invoiceData.customerId)
      .query(`
        INSERT INTO orders (orderDate, customerId)
        OUTPUT INSERTED.orderId
        VALUES (GETDATE(), @customerId)

      `);

    const orderId = orderResult.recordset[0].orderId;

    // Insert line items
    for (const item of products) {
      await transaction
        .request()
        .input("orderId", orderId)
        .input("productId", item.productId)
        .input("quantity", item.quantity)
        .query(`
          INSERT INTO orderLineItems (orderId, productId, quantity)
          VALUES (@orderId, @productId, @quantity)
        `);
    }

    await transaction.commit();

    res.status(201).json({
      message: "Order created successfully",
      orderId: orderId
    });

  } catch (err) {
  if (transactionStarted) await transaction.rollback();
  console.error(err);
  res.status(500).send("Internal server error");
    }
});

// GET /api/order/viewall

router.get('/viewall', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        orderNumber,
        orderDate,
        customerId
      FROM orders
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// GET /api/order/vieworderdetail

router.get('/vieworderdetail', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        o.orderId, 
        o.orderDate,
        o.orderNumber,
        c.customerId,
        c.customerName,
        c.customerAddress1,
        c.customerAddress2,
        c.customerCity,
        c.customerState,
        c.customerPostalCode,
        c.customerTelephone,
        c.customerContactName,
        c.customerEmailAddress,
        oi.lineItemId,
        p.productId,
        p.productName,
        p.productCost,
        oi.quantity
      FROM orders o
      JOIN customers c ON o.customerId = c.customerId
      JOIN orderLineItems oi ON o.orderId = oi.orderId
      JOIN products p ON oi.productId = p.productId
      ORDER BY o.orderNumber
    `);

    const rows = result.recordset;

    // Group by order_id
    const grouped = {};
    rows.forEach(row => {
      if (!grouped[row.orderId]) {
        grouped[row.orderId] = {
          customerDetail: {
            customerId: row.customerId,
            customerName: row.customerName,
            customerAddress1: row.customerAddress1,
            customerAddress2: row.customerAddress2,
            customerCity: row.customerCity,
            customerState: row.customerState,
            customerPostalCode: row.customerPostalCode,
            customerTelephone: row.customerTelephone,
            customerContactName: row.customerContactName,
            customerEmailAddress: row.customerEmailAddress
          },
          orderDetail: {
            invoiceNumber: row.orderNumber,
            invoiceDate: row.orderDate,
            customerId: row.customerId
          },
          lineItems: []
        };
      }

      grouped[row.orderId].lineItems.push({
        lineItemId: row.lineItemId,
        productId: row.productId,
        quantity: row.quantity,
        invoiceDate: row.orderDate,
        productName: row.productName,
        productCost: parseFloat(row.productCost).toFixed(2),
        totalCost: (row.quantity * row.productCost).toFixed(2)
      });
    });

    // Convert grouped object to array
    const response = Object.values(grouped);

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

// GET /api/order/details/:invoiceNumber
router.get('/details/:invoiceNumber', auth, async (req, res) => {
  const { invoiceNumber } = req.params;

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("invoiceNumber", invoiceNumber)
      .query(`
        SELECT
          o.orderNumber AS invoiceNumber,
          o.orderDate,
          o.customerId,
          c.customerName,
          c.customerAddress1,
          c.customerAddress2,
          c.customerCity,
          c.customerState,
          c.customerPostalCode,
          c.customerTelephone,
          c.customerContactName,
          c.customerEmailAddress,
          oi.lineItemId,
          oi.quantity,
          p.productId,
          p.productName,
          p.productCost
        FROM orders o
        JOIN customers c ON o.customerId = c.customerId
        JOIN orderLineItems oi ON o.orderId = oi.orderId
        JOIN products p ON oi.productId = p.productId
        WHERE o.orderNumber = @invoiceNumber
      `);

    if (result.recordset.length === 0) {
      return res.status(404).send("Order not found");
    }

    const rows = result.recordset;
    const first = rows[0];

    const response = {
      customerDetail: {
        customerId: first.customerId,
        customerName: first.customerName,
        customerAddress1: first.customerAddress1,
        customerAddress2: first.customerAddress2,
        customerCity: first.customerCity,
        customerState: first.customerState,
        customerPostalCode: first.customerPostalCode,
        customerTelephone: first.customerTelephone,
        customerContactName: first.customerContactName,
        customerEmailAddress: first.customerEmailAddress
      },
      orderDetail: {
        invoiceNumber: first.invoiceNumber,
        invoiceDate: first.orderDate,
        customerId: first.customerId
      },
      lineItems: rows.map(row => ({
        lineItemId: row.lineItemId,
        productId: row.productId,
        quantity: row.quantity,
        invoiceDate: row.orderDate,
        productName: row.productName,
        productCost: parseFloat(row.productCost).toFixed(2),
        totalCost: (row.quantity * row.productCost).toFixed(2)
      }))
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});


module.exports = router;
