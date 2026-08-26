const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    durationInDays: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    maxStaff: {
      type: Number,
      required: [true, 'Max staff is required'],
      min: [1, 'Must allow at least 1 staff member'],
    },
    maxAppointments: {
      type: Number,
      required: [true, 'Max appointments is required'],
      min: [1, 'Must allow at least 1 appointment'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', planSchema);
