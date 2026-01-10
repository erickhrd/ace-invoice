--Azure SQL

SET NOCOUNT ON;

-- CUSTOMERS TABLE

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'customers')
BEGIN
    CREATE TABLE customers (
        customerId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        customerName NVARCHAR(255) NOT NULL,
        customerAddress1 NVARCHAR(255) NOT NULL,
        customerAddress2 NVARCHAR(255) NULL,
        customerCity NVARCHAR(100) NOT NULL,
        customerState NVARCHAR(50) NOT NULL,
        customerPostalCode NVARCHAR(20) NOT NULL,
        customerTelephone NVARCHAR(50) NOT NULL,
        customerContactName NVARCHAR(255) NOT NULL,
        customerEmailAddress NVARCHAR(255) NOT NULL
    );
END;

-- PRODUCTS TABLE

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        productId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        productName NVARCHAR(255) NOT NULL,
        productCost DECIMAL(10,2) NOT NULL CHECK (productCost >= 0)
    );
END;

-- ORDERS TABLE

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        orderId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        orderNumber INT IDENTITY(1,1) NOT NULL UNIQUE,
        orderDate DATETIME DEFAULT GETDATE(),
        customerId UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_orders_customers
            FOREIGN KEY (customerId) REFERENCES customers(customerId)
    );
END;

-- ORDER_ITEMS TABLE

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'orderLineItems')
BEGIN
    CREATE TABLE orderLineItems (
        lineItemId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        orderId UNIQUEIDENTIFIER NOT NULL,
        productId UNIQUEIDENTIFIER NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        CONSTRAINT FK_lineitems_invoices
            FOREIGN KEY (orderId) REFERENCES orders(orderId),
        CONSTRAINT FK_lineitems_products
            FOREIGN KEY (productId) REFERENCES products(productId),
        CONSTRAINT UQ_invoice_product UNIQUE (orderId, productId)
    );
END;

-- SEED DATA (COSTUMERS)

IF NOT EXISTS (SELECT 1 FROM customers)
BEGIN
    INSERT INTO customers (
        customerName,
        customerAddress1,
        customerAddress2,
        customerCity,
        customerState,
        customerPostalCode,
        customerTelephone,
        customerContactName,
        customerEmailAddress
    )
    VALUES
    (
        'Smith, LLC',
        '505 Central Avenue',
        'Suite 100',
        'San Diego',
        'CA',
        '90383',
        '619-483-0987',
        'Jane Smith',
        'email@jane.com'
    ),
    (
        'Doe, Inc',
        '123 Main Street',
        NULL,
        'Los Angeles',
        'CA',
        '90010',
        '310-555-1212',
        'John Doe',
        'email@doe.com'
    );
END;

-- SEED DATA (PRODUCTS)

IF NOT EXISTS (SELECT 1 FROM products)
BEGIN
    INSERT INTO products (productName, productCost)
    VALUES
    ('Thingie', 2.00),
    ('Gadget', 5.15),
    ('Gizmo', 1.00),
    ('Widget', 2.50);
END;

-- SEED DATA (SAMPLE INVOICE)

IF NOT EXISTS (SELECT 1 FROM orders)
BEGIN
    DECLARE @orderId UNIQUEIDENTIFIER;
    DECLARE @orderDate UNIQUEIDENTIFIER;
    DECLARE @customerId UNIQUEIDENTIFIER;

    SELECT TOP 1 @customerId = customerId FROM customers;

    INSERT INTO orders (orderDate, customerId)
    VALUES (@orderDate, @customerId);

    SET @orderId = (SELECT TOP 1 orderId FROM orders ORDER BY orderNumber DESC);

    INSERT INTO orderLineItems (orderId, productId, quantity)
    SELECT
        @orderId,
        productId,
        CASE productName
            WHEN 'Gadget' THEN 5
            WHEN 'Thingie' THEN 2
        END
    FROM products
    WHERE productName IN ('Gadget', 'Thingie');
END;