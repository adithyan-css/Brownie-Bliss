const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      enum: ["delivery", "quality", "payment", "other"],
    },

    orderId: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "resolved"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);