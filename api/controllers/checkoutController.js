const CheckoutRecovery = require('../models/CheckoutRecovery');
const { randomUUID } = require('crypto');

/**
 * Create a new checkout recovery session.
 * Expects body: { customer_name, phone, email, address, city, pincode, items, total }
 */
async function createSession(req, res) {
  try {
    const {
      customer_name,
      phone,
      email,
      address,
      city,
      pincode,
      items,
      total,
    } = req.body;

    // Basic validation
    if (!customer_name || !phone || !address || !city || !pincode || !Array.isArray(items) || items.length === 0 || typeof total !== 'number') {
      return res.status(400).json({ success: false, message: 'Missing or invalid checkout data' });
    }

    const recovery_token = randomUUID();

    const session = new CheckoutRecovery({
      recovery_token,
      customer_name,
      phone,
      email,
      address,
      city,
      pincode,
      items,
      total,
      status: 'pending',
    });

    await session.save();
    return res.status(201).json({ success: true, recovery_token, message: 'Checkout session created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Restore an existing checkout session by token.
 */
async function restoreSession(req, res) {
  try {
    const { token } = req.params;
    const session = await CheckoutRecovery.findOne({ recovery_token: token });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Recovery session not found' });
    }
    if (session.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Recovery session already completed or expired' });
    }
    // Return stored data (excluding internal fields)
    const { recovery_token, created_at, updated_at, __v, ...payload } = session.toObject();
    return res.json({ success: true, session: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { createSession, restoreSession };
