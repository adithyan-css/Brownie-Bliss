const { z } = require('zod');

const productSchema = z.object({
  body: z.object({
    type: z.enum(['standard', 'birthday']),

    name: z
      .string()
      .trim()
      .min(2, 'Product name must be at least 2 characters')
      .max(100, 'Product name too long'),

    category: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    price: z
      .number({
        invalid_type_error: 'Price must be a number',
      })
      .positive('Price must be greater than 0'),

    emoji: z
      .string()
      .max(10)
      .optional(),

    img: z
      .string()
      .url('Invalid image URL')
      .optional(),

    description: z
      .string()
      .max(300, 'Description too long')
      .optional(),
  }),
});

module.exports = productSchema;
