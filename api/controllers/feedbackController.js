const Feedback = require("../models/Feedback");

const createFeedback = async (req, res) => {
  try {
    const { name, rating, message } = req.body;

    const feedback = await Feedback.create({
      name,
      rating,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createFeedback,
};