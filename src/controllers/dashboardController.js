const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const Salon = require('../models/Salon');
const { APPOINTMENT_STATUS, ATTENDANCE_STATUS } = require('../config/constants');
const { getTodayDateRange } = require('../utils/timeUtils');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/dashboard — Salon Owner / Receptionist
 * Dashboard data: today's stats, upcoming appointments, attendance.
 */
const getDashboard = async (req, res) => {
  try {
    const salonId = req.salonId;
    const salon = await Salon.findById(salonId).select('subscriptionStatus');
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      salonId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED] },
    });

    // Today's completed
    const completedToday = await Appointment.countDocuments({
      salonId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: APPOINTMENT_STATUS.COMPLETED,
    });

    // Today's pending
    const pendingToday = await Appointment.countDocuments({
      salonId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: APPOINTMENT_STATUS.PENDING,
    });

    // Total clients
    const totalClients = await Client.countDocuments({ salonId });

    // Total active staff
    const totalStaff = await Staff.countDocuments({ salonId, isActive: true });

    // Today's check-ins
    const todayCheckIns = await Attendance.countDocuments({
      salonId,
      status: ATTENDANCE_STATUS.CHECKED_IN,
      checkInTime: { $gte: startOfDay, $lt: endOfDay },
    });

    // Upcoming appointments (next 5)
    const upcomingAppointments = await Appointment.find({
      salonId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    })
      .populate('clientId', 'name phone')
      .populate('serviceId', 'name duration')
      .populate('staffId', 'name')
      .sort({ startTime: 1 })
      .limit(5);

    return success(res, {
      subscriptionStatus: salon?.subscriptionStatus,
      todayAppointments,
      completedToday,
      pendingToday,
      totalClients,
      totalStaff,
      todayCheckIns,
      upcomingAppointments,
    }, 'Dashboard data retrieved');
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to retrieve dashboard data.', 500);
  }
};

module.exports = { getDashboard };
