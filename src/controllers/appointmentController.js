const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const Salon = require('../models/Salon');
const Plan = require('../models/Plan');
const { APPOINTMENT_STATUS } = require('../config/constants');
const { addMinutesToTime, isWithinWorkingHours, timesOverlap, getTodayDateRange } = require('../utils/timeUtils');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/appointments — Salon Owner / Receptionist
 * Create appointment with full server-side validation:
 *   1. Working hours check
 *   2. Staff conflict detection
 *   3. maxAppointments plan limit check
 */
const createAppointment = async (req, res) => {
  try {
    const { clientId, serviceId, staffId, date, startTime, notes } = req.body;
    const salonId = req.salonId;

    // Validate required fields
    if (!clientId || !serviceId || !staffId || !date || !startTime) {
      return error(res, 'Required fields: clientId, serviceId, staffId, date, startTime.', 400);
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      return error(res, 'Start time must be in HH:mm format.', 400);
    }

    // Get service to calculate endTime
    const service = await Service.findOne({ _id: serviceId, salonId });
    if (!service) {
      return error(res, 'Service not found in this salon.', 404);
    }

    // Calculate end time from service duration
    const endTime = addMinutesToTime(startTime, service.duration);

    // Get salon for working hours
    const salon = req.salon || await Salon.findById(salonId);

    // 1. Validate working hours
    if (!isWithinWorkingHours(startTime, endTime, salon.openingTime, salon.closingTime)) {
      return error(
        res,
        `Appointment must fall fully within working hours (${salon.openingTime}–${salon.closingTime}). Requested: ${startTime}–${endTime}.`,
        400,
        'OUTSIDE_WORKING_HOURS'
      );
    }

    // Verify staff belongs to this salon
    const staff = await Staff.findOne({ _id: staffId, salonId });
    if (!staff) {
      return error(res, 'Staff not found in this salon.', 404);
    }

    // 2. Check staff conflict — same staff, same date, overlapping non-cancelled appointment
    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      staffId,
      salonId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED] },
    });

    const hasConflict = existingAppointments.some((appt) =>
      timesOverlap(appt.startTime, appt.endTime, startTime, endTime)
    );

    if (hasConflict) {
      return error(
        res,
        `Staff member "${staff.name}" already has an appointment during ${startTime}–${endTime}. Please choose a different time or staff member.`,
        409,
        'STAFF_CONFLICT'
      );
    }

    // 3. Check maxAppointments plan limit (monthly)
    if (salon.currentPlan) {
      const plan = await Plan.findById(salon.currentPlan);
      if (plan) {
        const monthStart = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), 1);
        const monthEnd = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthlyCount = await Appointment.countDocuments({
          salonId,
          date: { $gte: monthStart, $lte: monthEnd },
          status: { $nin: [APPOINTMENT_STATUS.CANCELLED] },
        });

        if (monthlyCount >= plan.maxAppointments) {
          return error(
            res,
            `Monthly appointment limit (${plan.maxAppointments}) reached for your current plan. Please upgrade your plan.`,
            403,
            'APPOINTMENT_LIMIT_REACHED'
          );
        }
      }
    }

    // Create appointment
    const appointment = await Appointment.create({
      clientId,
      serviceId,
      staffId,
      salonId,
      date: appointmentDate,
      startTime,
      endTime,
      status: APPOINTMENT_STATUS.PENDING,
      notes,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('clientId', 'name phone')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name');

    return success(res, populated, 'Appointment created successfully', 201);
  } catch (err) {
    console.error('Create appointment error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/appointments — Salon Owner / Receptionist
 * List appointments for the salon with optional date and status filters.
 */
const getAppointments = async (req, res) => {
  try {
    const salonId = req.salonId;
    const { date, status, staffId, page = 1, limit = 20 } = req.query;

    const filter = { salonId };

    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      filter.status = status;
    }

    if (staffId) {
      filter.staffId = staffId;
    }

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name phone email')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name')
      .sort({ date: -1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return success(res, {
      appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    }, 'Appointments retrieved');
  } catch (err) {
    console.error('Get appointments error:', err);
    return error(res, 'Failed to retrieve appointments.', 500);
  }
};

/**
 * GET /api/appointments/today — Salon Owner / Receptionist
 * Get today's appointments for the salon.
 */
const getTodayAppointments = async (req, res) => {
  try {
    const salonId = req.salonId;
    const { startOfDay, endOfDay } = getTodayDateRange();

    const appointments = await Appointment.find({
      salonId,
      date: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate('clientId', 'name phone email')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name')
      .sort({ startTime: 1 });

    return success(res, appointments, "Today's appointments retrieved");
  } catch (err) {
    console.error('Get today appointments error:', err);
    return error(res, 'Failed to retrieve appointments.', 500);
  }
};

/**
 * PATCH /api/appointments/:id/status — Salon Owner / Receptionist
 * Update appointment status.
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const salonId = req.salonId;

    if (!status || !Object.values(APPOINTMENT_STATUS).includes(status)) {
      return error(res, `Invalid status. Must be one of: ${Object.values(APPOINTMENT_STATUS).join(', ')}`, 400);
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, salonId });
    if (!appointment) {
      return error(res, 'Appointment not found.', 404);
    }

    appointment.status = status;
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('clientId', 'name phone')
      .populate('serviceId', 'name duration price')
      .populate('staffId', 'name');

    return success(res, populated, 'Appointment status updated');
  } catch (err) {
    console.error('Update appointment status error:', err);
    return error(res, err.message, 500);
  }
};

module.exports = { createAppointment, getAppointments, getTodayAppointments, updateAppointmentStatus };
