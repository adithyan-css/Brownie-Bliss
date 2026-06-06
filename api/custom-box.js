const express = require('express');
const router = express.Router();
const CustomBox = require('../models/CustomBox');

// POST - Create a new custom box order
router.post('/custom-box', async (req, res) => {
  try {
    const { boxSize, items, totalPrice, sessionId, userId } = req.body;
    
    // Validation
    if (!boxSize || ![4, 6, 12].includes(boxSize)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid box size. Choose 4, 6, or 12.' 
      });
    }
    
    if (!items || items.length !== boxSize) {
      return res.status(400).json({ 
        success: false, 
        error: `Box must have exactly ${boxSize} items. Currently has ${items?.length || 0}.` 
      });
    }
    
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid total price.' 
      });
    }
    
    // Create custom box in database
    const customBox = new CustomBox({
      boxSize,
      items,
      totalPrice,
      sessionId: sessionId || `session_${Date.now()}`,
      userId: userId || 'guest',
      createdAt: new Date()
    });
    
    await customBox.save();
    
    res.status(201).json({
      success: true,
      message: 'Custom box created successfully!',
      data: {
        id: customBox._id,
        orderId: customBox.orderId,
        boxSize: customBox.boxSize,
        items: customBox.items,
        totalPrice: customBox.totalPrice,
        status: customBox.status,
        createdAt: customBox.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating custom box:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET - Get all custom boxes for a session/user
router.get('/custom-box/session/:sessionId', async (req, res) => {
  try {
    const boxes = await CustomBox.find({ 
      sessionId: req.params.sessionId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: boxes.length,
      data: boxes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Get single custom box by ID
router.get('/custom-box/:id', async (req, res) => {
  try {
    const box = await CustomBox.findById(req.params.id);
    if (!box) {
      return res.status(404).json({ success: false, error: 'Custom box not found' });
    }
    res.json({ success: true, data: box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Update custom box status
router.put('/custom-box/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const box = await CustomBox.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!box) {
      return res.status(404).json({ success: false, error: 'Custom box not found' });
    }
    
    res.json({ success: true, data: box });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Remove custom box
router.delete('/custom-box/:id', async (req, res) => {
  try {
    const box = await CustomBox.findByIdAndDelete(req.params.id);
    if (!box) {
      return res.status(404).json({ success: false, error: 'Custom box not found' });
    }
    res.json({ success: true, message: 'Custom box removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Get custom box statistics (for admin)
router.get('/admin/custom-box-stats', async (req, res) => {
  try {
    const totalBoxes = await CustomBox.countDocuments();
    const totalRevenue = await CustomBox.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const popularItems = await CustomBox.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalBoxes,
        totalRevenue: totalRevenue[0]?.total || 0,
        popularItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;