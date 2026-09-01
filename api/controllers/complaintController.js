const Complaint = require("../models/Complaint");

const createComplaint = async (req, res) => {
  try {
    const { subject, orderId, description } = req.body;

    const complaint = await Complaint.create({
      subject,
      orderId,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createComplaint,
};