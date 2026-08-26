const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    distanceFromSalon: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ staffId: 1, checkInTime: -1 });
attendanceSchema.index({ salonId: 1, checkInTime: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
