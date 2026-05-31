const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

let isConnected = false;

async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    return; // Run in memory/static mode
  }

  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
    const Product = require('../models/Product');
    await Product.seedProducts();
  } catch (err) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

function isDbReady() {
  return Boolean(process.env.MONGO_URI) && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDbReady };
