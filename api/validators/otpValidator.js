const { z } = require('zod');

const sendOtpSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number format'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number format'),
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
};
