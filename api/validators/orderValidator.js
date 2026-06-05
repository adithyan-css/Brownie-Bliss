const { z } = require('zod');

// Item schema
const orderItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(1, 'Item name required').optional(),
  price: z.number().positive('Invalid item price').optional(),
  qty: z.number().int().positive('Quantity must be at least 1'),
  emoji: z.string().optional(),
  category: z.string().optional(),
});

// Main order schema
const orderSchema = z.object({
  body: z.object({
    customer_name: z.string().trim().min(2, 'Customer name required').max(100),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
    address: z.string().trim().min(5, 'Address too short'),
    city: z.string().trim().min(2, 'City required'),
    pincode: z.string().regex(/^\d{5,6}$/, 'Invalid pincode'),
    items: z.array(orderItemSchema).min(1, 'At least one item required'),
    total: z.number().positive('Invalid total amount'),
    notes: z.string().max(500).optional(),
  }),
});

module.exports = orderSchema;
