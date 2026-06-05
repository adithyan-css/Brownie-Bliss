const request = require('supertest');
const mongoose = require('mongoose');

// Mock mongoose connection and models to prevent needing an active Mongo instance for fast unit/integration testing
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  const mockMongoose = {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      readyState: 1,
      on: jest.fn(),
      once: jest.fn(),
    },
    set: jest.fn()
  };
  return mockMongoose;
});

// Mock models
jest.mock('../models/Product', () => {
  return {
    countDocuments: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { id_ref: 1, name: "Velvet Dream Cake", price: 850 }
      ])
    })
  };
});

jest.mock('../models/Otp', () => {
  return {
    updateMany: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({})
  };
});

// Initialize environment variables for testing before loading the app
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'secure_password_test';
process.env.ADMIN_JWT_SECRET = 'secret_test_key_123';
process.env.NODE_ENV = 'test';

// Load the express app
const { app } = require('../api/index');

describe('Brownie-Bliss API Security & Endpoint Integration Tests', () => {
  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products list with HTTP 200', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.products[0].name).toBe("Velvet Dream Cake");
    });
  });

  describe('POST /api/admin/login validation', () => {
    it('should reject requests with missing credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('should reject invalid credentials with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'wrong_password' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('Security Headers', () => {
    it('should contain helmet security headers like X-Content-Type-Options', async () => {
      const res = await request(app).get('/api/products');
      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
