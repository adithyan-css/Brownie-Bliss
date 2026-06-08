const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

let isConnected = false;
let connectingPromise = null;
let lastAttemptAt = 0;
const RETRY_AFTER_MS = 30 * 1000;

async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    return false; // Run in memory/static mode
  }

  if (isConnected && mongoose.connection.readyState === 1) return true;
  if (connectingPromise) return connectingPromise;

  if (Date.now() - lastAttemptAt < RETRY_AFTER_MS) {
    return false;
  }

  lastAttemptAt = Date.now();
  connectingPromise = (async () => {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 3000,
        socketTimeoutMS: 45000,
        maxPoolSize: 1,
      });
      isConnected = true;
      const Product = require('../models/Product');
      await Product.seedProducts();
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (err) {
      isConnected = false;
      console.error('❌ MongoDB connection error:', err.message);
      return false;
    } finally {
      connectingPromise = null;
    }
  })();

  return connectingPromise;
}

function isDbReady() {
  return Boolean(process.env.MONGO_URI) && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDbReady };
