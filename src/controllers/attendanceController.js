const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const Salon = require('../models/Salon');
const { haversineDistance } = require('../utils/haversine');
const { ATTENDANCE_STATUS } = require('../config/constants');
const { getTodayDateRange } = require('../utils/timeUtils');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/attendance/check-in — Salon Owner / Receptionist
 * Geo-fenced staff check-in using Haversine formula.
 * Distance math runs server-side — never trust a frontend "inside/outside" flag.
 */
const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user._id;
    const salonId = req.salonId;

    // Validate GPS coordinates
    if (latitude == null || longitude == null) {
      return error(
        res,
        'GPS coordinates are required. Please enable location services and try again.',
        400,
        'GPS_REQUIRED'
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return error(res, 'Latitude and longitude must be numbers.', 400, 'INVALID_COORDINATES');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return error(res, 'Invalid GPS coordinates range.', 400, 'INVALID_COORDINATES');
    }

    // Get salon location
    const salon = req.salon || await Salon.findById(salonId);
    if (!salon) {
      return error(res, 'Salon not found.', 404);
    }

    // Find staff linked to this user
    let staff = await Staff.findOne({ userId, salonId });
    // If no staff record linked, check if user is salon owner
    if (!staff) {
      staff = await Staff.findOne({ salonId, email: req.user.email });
    }
    if (!staff) {
      return error(res, 'No staff record found for this user.', 404, 'STAFF_NOT_FOUND');
    }

    // Calculate distance using Haversine formula (server-side)
    const distance = haversineDistance(
      latitude,
      longitude,
      salon.latitude,
      salon.longitude
    );

    const distanceRounded = Math.round(distance * 100) / 100;

    // Check if within allowed radius
    if (distance > salon.allowedRadius) {
      // Record the rejected attempt
      await Attendance.create({
        staffId: staff._id,
        userId,
        salonId,
        latitude,
        longitude,
        distanceFromSalon: distanceRounded,
        status: ATTENDANCE_STATUS.REJECTED,
      });

      return res.status(403).json({
        error: 'OUT_OF_RANGE',
        message: `You are ${distanceRounded.toFixed(0)}m away from the salon. Allowed radius is ${salon.allowedRadius}m.`,
        distance: distanceRounded,
        allowedRadius: salon.allowedRadius,
      });
    }

    // Check-in accepted
    const attendance = await Attendance.create({
      staffId: staff._id,
      userId,
      salonId,
      latitude,
      longitude,
      distanceFromSalon: distanceRounded,
      status: ATTENDANCE_STATUS.CHECKED_IN,
    });

    return success(res, {
      attendance,
      distance: distanceRounded,
      message: `Check-in successful. You are ${distanceRounded.toFixed(0)}m from the salon.`,
    }, 'Check-in accepted', 201);
  } catch (err) {
    console.error('Check-in error:', err);
    return error(res, 'Check-in failed.', 500);
  }
};

/**
 * GET /api/attendance/status — Salon Owner / Receptionist
 * Get today's check-in status for the current user.
 */
const getAttendanceStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const salonId = req.salonId;
    const { startOfDay, endOfDay } = getTodayDateRange();

    const todayAttendance = await Attendance.findOne({
      userId,
      salonId,
      status: ATTENDANCE_STATUS.CHECKED_IN,
      checkInTime: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ checkInTime: -1 });

    return success(res, {
      checkedIn: !!todayAttendance,
      attendance: todayAttendance,
    }, 'Attendance status retrieved');
  } catch (err) {
    console.error('Get attendance status error:', err);
    return error(res, 'Failed to retrieve attendance status.', 500);
  }
};

module.exports = { checkIn, getAttendanceStatus };
