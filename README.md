# 🍫 Brownie Bliss — Full Stack Order System

#Live Demo Link : https://brownie-bliss-g5przdn30-adithyansubramani1-1657s-projects.vercel.app



## What's Included
- **Frontend**: Homepage, Products, Birthday, Contact pages
- **Checkout Flow**: Name → Phone → OTP Verification → Address → WhatsApp order
- **Backend**: Node.js + Express + MongoDB / Mongoose
- **Admin Panel**: View all orders, confirm payments, generate receipts

---

## 📁 Project Structure
```
brownie-bliss/
├── api/index.js       ← Backend entry point (Express + MongoDB)
├── package.json
├── public/
│   ├── index.html     ← Homepage
│   ├── products.html  ← All products
│   ├── birthday.html  ← Birthday packages
│   ├── contact.html   ← Contact page
│   ├── admin.html     ← Admin panel (orders + receipts)
│   ├── script.js      ← Shared cart + checkout + OTP logic
│   └── style.css      ← All styles
└── .env               ← Local environment variables (not committed)
```

---

## 🚀 Setup & Run

### 1. Install Dependencies
```bash
cd brownie-bliss
npm install
```

### 2. Configure WhatsApp Number
Open `public/script.js` and update the `fullPhone` variable inside the `sendWhatsAppFinal` function:
```js
const fullPhone = `918072596340`; // Replace with YOUR WhatsApp number
```
Format: country code + number, no plus sign or spaces. E.g., `919876543210`

### 3. Configure Environment Variables
Create a `.env` file in the project root to configure admin credentials, JWT signing, and the database connection.

Required keys:
- `ADMIN_USERNAME` — admin username for the admin panel
- `ADMIN_PASSWORD` — admin password
- `ADMIN_JWT_SECRET` — long random secret used to sign JWTs
- `MONGO_URI` — MongoDB connection string

Optional keys:
- `ADMIN_JWT_EXPIRES_IN` — JWT expiry (e.g. `2h`, defaults to `2h`)
- `FAST2SMS_API_KEY` — optional SMS provider API key for OTP delivery

Example `.env`:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
ADMIN_JWT_SECRET=replace_with_long_random_secret
ADMIN_JWT_EXPIRES_IN=2h
MONGO_URI=mongodb://127.0.0.1:27017/brownie_bliss
FAST2SMS_API_KEY=your_fast2sms_api_key_here
```

After editing `.env`, restart the server so the new values are picked up.

### 4. Start the Server
```bash
npm start
```
or for auto-reload during development:
```bash
npm run dev
```

### 5. Open in Browser
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

Replace the `sendOTP` logic in `api/index.js`:
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
Admin authentication now uses secure JWT-based server-side authentication with credentials stored in environment variables.

To set up the admin panel:
1. Ensure `.env` is configured with `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET`.
2. Access `/admin-login.html` to log in securely.

---

Built with ❤️ for Brownie Bliss
