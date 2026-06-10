# Brownie-Bliss API Documentation

This document covers all active endpoints, schemas, authentication patterns, and validation rules for the Brownie-Bliss Bakery Order Management system.

---

## Base URL

*   **Development**: `http://localhost:3000`
*   **Production**: Mapped via Vercel Serverless Function

---

## Authentication

Admin routes are secured using JWT (JSON Web Tokens). Authenticated requests must include the token in the `Authorization` header.

```http
Authorization: Bearer <your_admin_jwt_token>
```

---

## Endpoint Reference

### 1. Admin Authentication

#### `POST /api/admin/login`
Logs in the administrator and returns a JWT access token.

*   **Request Body**:
    ```json
    {
      "username": "admin",
      "password": "your_secure_password"
    }
    ```
*   **Response (Success)**:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "2h"
    }
    ```
*   **Errors**:
    *   `400 Bad Request`: Missing username or password parameters.
    *   `401 Unauthorized`: Invalid username or password comparison.

---

### 2. Products Management

#### `GET /api/products`
Retrieves all bakery products (standard items and birthday cakes).

*   **Response**:
    ```json
    {
      "success": true,
      "products": [
        {
          "_id": "603d15a31d950f24f0c4391e",
          "type": "standard",
          "id_ref": 1,
          "name": "Velvet Dream Cake",
          "category": "cakes",
          "price": 850,
          "emoji": "🎂",
          "img": "https://theobroma.in/..."
        }
      ]
    }
    ```

#### `POST /api/products` (Admin Only)
Adds a new product to the catalog.

*   **Request Body**:
    ```json
    {
      "type": "standard",
      "name": "Triple Chocolate Cookie",
      "category": "cookies",
      "price": 120,
      "emoji": "🍪",
      "img": "https://example.com/cookie.jpg"
    }
    ```
*   **Response (Success)**:
    ```json
    {
      "success": true,
      "product": { ... }
    }
    ```

#### `PATCH /api/products/:id` (Admin Only)
Updates an existing product's details.

*   **Request Body** (All fields optional):
    ```json
    {
      "name": "Updated Delight Name",
      "price": 1050,
      "img": "https://example.com/new_image.jpg"
    }
    ```
*   **Response (Success)**:
    ```json
    {
      "success": true,
      "product": { ... }
    }
    ```

#### `DELETE /api/products/:id` (Admin Only)
Removes a product from the database.

*   **Response**:
    ```json
    {
      "success": true,
      "message": "Product deleted"
    }
    ```

---

### 3. Orders Management

#### `POST /api/orders`
Submits a new customer order.

*   **Request Body**:
    ```json
    {
      "customer_name": "John Doe",
      "phone": "+919876543210",
      "address": "123 Sweet Lane",
      "city": "Mumbai",
      "pincode": "400001",
      "items": [
        {
          "name": "Velvet Dream Cake",
          "price": 850,
          "qty": 1,
          "emoji": "🎂",
          "category": "cakes"
        }
      ],
      "total": 850
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "order_id": "BB-20260524-8149",
      "message": "Order placed successfully"
    }
    ```

#### `GET /api/orders` (Admin Only)
Retrieves all orders, optionally filtered by status or payment status.

*   **Query Parameters**:
    *   `status`: Filter by status (`pending`, `confirmed`, `preparing`, `delivered`, `cancelled`) or payment status (`unpaid`, `paid`). Pass `all` to bypass filter.
*   **Response**:
    ```json
    {
      "success": true,
      "orders": [ ... ]
    }
    ```

#### `GET /api/orders/:orderId`
Retrieves a single order's details by order_id reference.

*   **Response**:
    ```json
    {
      "success": true,
      "order": { ... }
    }
    ```

#### `PATCH /api/orders/:orderId/confirm-payment` (Admin Only)
Marks an order's payment status as `paid` and advances order status to `confirmed`.

*   **Request Body**:
    ```json
    {
      "notes": "Paid via UPI transaction reference #123456"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "message": "Payment confirmed"
    }
    ```

#### `PATCH /api/orders/:orderId/status` (Admin Only)
Updates the preparation/delivery status of an order.

*   **Request Body**:
    ```json
    {
      "status": "preparing"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true
    }
    ```

---

### 4. Admin Dashboard Metrics

#### `GET /api/stats` (Admin Only)
Returns revenue, counts of total, pending, and paid orders.

*   **Response**:
    ```json
    {
      "success": true,
      "stats": {
        "total_orders": 42,
        "pending_orders": 5,
        "paid_orders": 37,
        "total_revenue": 31450
      }
    }
    ```

---

### 5. Verification OTP Services

#### `POST /api/send-otp`
Sends a one-time numeric passcode to a customer's phone number for validation.

*   **Request Body**:
    ```json
    {
      "phone": "9876543210"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "message": "OTP sent successfully"
    }
    ```

#### `POST /api/verify-otp`
Verifies the numeric passcode sent to the phone number.

*   **Request Body**:
    ```json
    {
      "phone": "9876543210",
      "otp": "123456"
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "message": "OTP verified"
    }
    ```
