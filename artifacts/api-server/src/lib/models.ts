import mongoose from "mongoose";

const ORDER_STATUSES = [
  "pending",
  "payment_confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    emoji: { type: String, default: "brownie" },
    category: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, unique: true, required: true },
    customer_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    notes: { type: String, default: "" },
    confirmed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at" } }
);

otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const productSchema = new mongoose.Schema({
  type: { type: String, enum: ["standard", "birthday"], required: true },
  id_ref: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  emoji: { type: String },
  img: { type: String },
  description: { type: String },
});

export const Order =
  mongoose.models["Order"] || mongoose.model("Order", orderSchema);
export const Otp =
  mongoose.models["Otp"] || mongoose.model("Otp", otpSchema);
export const Product =
  mongoose.models["Product"] || mongoose.model("Product", productSchema);
export { ORDER_STATUSES };

export async function seedProducts(): Promise<void> {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const initialProducts = [
    { type: "standard", id_ref: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, emoji: "cake", img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { type: "standard", id_ref: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, emoji: "cake", img: "https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
    { type: "standard", id_ref: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, emoji: "pineapple", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
    { type: "standard", id_ref: 4, name: "Overload Brownie", category: "brownies", price: 120, emoji: "brownie", img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338" },
    { type: "standard", id_ref: 5, name: "Walnut Fudge", category: "brownies", price: 95, emoji: "walnut", img: "https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181" },
    { type: "standard", id_ref: 6, name: "Classic Choco", category: "brownies", price: 80, emoji: "brownie", img: "https://www.labonelfinebaking.shop/wp-content/uploads/2021/02/CLASSIC-CHOCOLATE-CAKE.jpg" },
    { type: "standard", id_ref: 7, name: "Chocolate Mousse", category: "desserts", price: 150, emoji: "dessert", img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427" },
    { type: "standard", id_ref: 8, name: "Tiramisu Jar", category: "desserts", price: 180, emoji: "coffee", img: "https://brokenovenbaking.com/wp-content/uploads/2021/12/gingerbread-tiramisu-jars-14-1024x1024.jpg" },
    { type: "standard", id_ref: 9, name: "Choco Chip Cookies", category: "cookies", price: 250, emoji: "cookie", img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg" },
    { type: "standard", id_ref: 10, name: "Almond Biscotti", category: "cookies", price: 300, emoji: "biscotti", img: "https://theglutenfreeaustrian.com/wp-content/uploads/2023/12/almondbiscotti9-768x768.jpg" },
    { type: "birthday", id_ref: "Red Velvet", name: "Red Velvet", price: 850, emoji: "cake", img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
    { type: "birthday", id_ref: "Dutch Truffle", name: "Dutch Truffle", price: 950, emoji: "cake", img: "https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180" },
    { type: "birthday", id_ref: "Pineapple", name: "Pineapple", price: 675, emoji: "pineapple", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
    { type: "birthday", id_ref: "Chocoholic", name: "Chocoholic", price: 900, emoji: "brownie", img: "https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267" },
    { type: "birthday", id_ref: "Black Forest", name: "Black Forest", price: 750, emoji: "cake", img: "https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg" },
    { type: "birthday", id_ref: "Cheesecake", name: "Cheesecake", price: 1200, emoji: "cheesecake", img: "https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg" },
  ];

  await Product.insertMany(initialProducts);
}
