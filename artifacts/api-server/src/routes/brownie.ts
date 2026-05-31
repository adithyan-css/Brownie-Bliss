import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { connectDB } from "../lib/db";
import { Order, Otp, Product, ORDER_STATUSES, seedProducts } from "../lib/models";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "2h";

async function withDB(req: Request, res: Response, fn: () => Promise<void>) {
  try {
    await connectDB();
    await fn();
  } catch (err: any) {
    if (err.message?.includes("MONGO_URI")) {
      res.status(503).json({ success: false, message: "Database not configured" });
    } else {
      res.status(500).json({ success: false, message: err.message || "Server error" });
    }
  }
}

function generateOrderId(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BB-${datePart}-${rand}`;
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/admin/login", (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
    res.status(500).json({ success: false, message: "Admin auth not configured" });
    return;
  }

  if (!username || !password) {
    res.status(400).json({ success: false, message: "Username and password are required" });
    return;
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ username: ADMIN_USERNAME }, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_JWT_EXPIRES_IN as any,
  });

  res.json({ success: true, token, expiresIn: ADMIN_JWT_EXPIRES_IN });
});

router.post("/send-otp", async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      res.status(400).json({ success: false, message: "Invalid phone number" });
      return;
    }

    await Otp.updateMany({ phone, used: false }, { used: true });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ phone, otp, expires_at });

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && apiKey !== "your_actual_api_key_here") {
      try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
          params: { route: "otp", variables_values: otp, numbers: phone },
          headers: { authorization: apiKey },
        });
      } catch (smsErr: any) {
        console.error("Fast2SMS Error:", smsErr.response?.data || smsErr.message);
      }
    } else {
      console.log(`[DEMO MODE] OTP for ${phone}: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent successfully" });
  });
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { phone, otp } = req.body;

    const record = await Otp.findOne({
      phone,
      otp,
      used: false,
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 });

    if (!record) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      return;
    }

    record.used = true;
    await record.save();

    res.json({ success: true, message: "OTP verified" });
  });
});

router.get("/products", async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    await seedProducts();
    const products = await Product.find().lean();
    res.json({ success: true, products });
  });
});

router.post("/products", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { type, name, category, price, emoji, img, description } = req.body;

    if (!type || !name || price === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    let id_ref: any;
    if (type === "standard") {
      const lastProduct = await Product.findOne({ type: "standard" }).sort({ id_ref: -1 });
      id_ref = lastProduct && typeof (lastProduct as any).id_ref === "number"
        ? (lastProduct as any).id_ref + 1
        : 1;
    } else {
      id_ref = name;
    }

    const product = await Product.create({
      type, id_ref, name, category, price: Number(price), emoji, img, description,
    });

    res.json({ success: true, product });
  });
});

router.patch("/products/:id", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { price, name, img } = req.body;
    const updateData: Record<string, any> = {};

    if (price !== undefined && !Number.isNaN(Number(price)) && Number(price) >= 0) {
      updateData.price = Number(price);
    }
    if (name !== undefined && name.trim() !== "") {
      updateData.name = name.trim();
    }
    if (img !== undefined) {
      updateData.img = img.trim();
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, message: "No valid fields provided for update" });
      return;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    res.json({ success: true, product });
  });
});

router.delete("/products/:id", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.json({ success: true, message: "Product deleted" });
  });
});

router.post("/orders", async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { customer_name, phone, address, city, pincode, items, total } = req.body;

    if (!customer_name || !phone || !address || !city || !pincode || !items || !total) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const order = await Order.create({
      order_id: generateOrderId(),
      customer_name, phone, address, city, pincode, items, total,
    });

    res.json({
      success: true,
      order_id: (order as any).order_id,
      message: "Order placed successfully",
    });
  });
});

router.get("/orders", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { status } = req.query as { status?: string };
    const filter: Record<string, any> = {};

    if (status && status !== "all") {
      filter.$or = [{ status }, { payment_status: status }];
    }

    const orders = await Order.find(filter).sort({ created_at: -1 }).lean();
    res.json({ success: true, orders });
  });
});

router.get("/orders/track/:orderId", async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, order });
  });
});

router.get("/orders/:orderId", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, order });
  });
});

router.patch("/orders/:orderId/confirm-payment", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { notes } = req.body;
    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      {
        payment_status: "paid",
        status: "payment_confirmed",
        confirmed_at: new Date(),
        notes: notes || "Payment confirmed via WhatsApp",
      },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true, message: "Payment confirmed" });
  });
});

router.patch("/orders/:orderId/status", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: "Invalid order status" });
      return;
    }

    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      { status },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.json({ success: true });
  });
});

router.get("/stats", adminAuth, async (req: Request, res: Response) => {
  await withDB(req, res, async () => {
    const [totalOrders, pendingOrders, paidOrders, revenueResult] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ payment_status: "paid" }),
      Order.aggregate([
        { $match: { payment_status: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        paid_orders: paidOrders,
        total_revenue: (revenueResult[0] as any)?.total || 0,
      },
    });
  });
});

export default router;
