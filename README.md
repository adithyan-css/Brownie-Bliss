# 🍫 Brownie Bliss — Full Stack Order System

## What's Included
- **Frontend**: Homepage, Products, Birthday, Contact pages
- **Checkout Flow**: Name → Phone → OTP Verification → Address → WhatsApp order
- **Backend**: Node.js + Express + SQLite (no external DB needed)
- **Admin Panel**: View all orders, confirm payments, generate receipts

---

## 📁 Project Structure
```
brownie-bliss/
├── server.js          ← Backend (Express + SQLite)
├── package.json
├── brownie_bliss.db   ← Created automatically on first run
└── public/
    ├── index.html     ← Homepage
    ├── products.html  ← All products
    ├── birthday.html  ← Birthday packages
    ├── contact.html   ← Contact page
    ├── admin.html     ← Admin panel (orders + receipts)
    ├── cart.js        ← Shared cart + checkout + OTP logic
    └── style.css      ← All styles
```

---

## 🚀 Setup & Run

### 1. Install Dependencies
```bash
cd brownie-bliss
npm install
```

### 2. Configure WhatsApp Number
Open `public/cart.js` and update line 3:
```js
const BUSINESS_WHATSAPP = '919876543210'; // Replace with YOUR WhatsApp number
```
Format: country code + number, no + or spaces. E.g., `919876543210`

### 3. Start the Server
```bash
npm start
```
or for auto-reload during development:
```bash
npm run dev
```

### 4. Open in Browser
- **Shop**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

---

## 🔄 Customer Order Flow
1. Customer adds items to cart
2. Clicks "Proceed to Order"
3. Enters **Name** + **WhatsApp number**
4. Receives **OTP** (demo OTP shown on screen — integrate SMS provider for production)
5. Enters **delivery address**
6. Reviews order and clicks **"Place Order & Open WhatsApp"**
7. WhatsApp opens with full order details sent to your business number
8. Admin confirms payment → receipt is generated

---

## 👨‍💼 Admin Panel Features
- **Stats Dashboard**: Total orders, pending, paid, revenue
- **Orders Table**: All orders with customer details
- **Filter**: By status (pending / confirmed / delivered)
- **Confirm Payment**: One-click confirmation after WhatsApp payment
- **Order Status**: Dropdown to update status (pending → confirmed → preparing → delivered)
- **Receipt Generator**: Printable receipt with order details, paid stamp
- **Auto Refresh**: Every 30 seconds

---

## 📱 OTP Integration (Production)
Currently OTP is simulated (shown on screen for demo).

To integrate real SMS OTP, use one of:
- **MSG91**: https://msg91.com (popular in India)
- **Twilio**: https://twilio.com
- **Fast2SMS**: https://fast2sms.com (cheapest for India)

Replace the `sendOTP` endpoint in `server.js`:
```js
// After generating OTP, add SMS sending:
const msg91 = require('msg91');
msg91.sendOTP(phone, otp);
```

---

## 🛠️ Customization
- Edit products in `public/products.html` (the `allProducts` array)
- Change brand colors in `style.css` (`:root` variables)
- Add more order statuses in `admin.html`
- Modify receipt template in `admin.html` → `viewReceipt()` function

---

## 🔐 Admin Security (Production)
Currently the admin panel has no password. For production, add:
1. A simple password prompt in `admin.html`
2. Or JWT authentication via Express middleware

---

Built with ❤️ for Brownie Bliss
