const Service = require('../models/Service');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/services — Salon Owner / Receptionist
 * List services scoped to the authenticated user's salon.
 */
const getServices = async (req, res) => {
  try {
    const salonId = req.salonId;
    const services = await Service.find({ salonId, isActive: true }).sort({ name: 1 });
    return success(res, services, 'Services retrieved');
  } catch (err) {
    console.error('Get services error:', err);
    return error(res, 'Failed to retrieve services.', 500);
  }
};

module.exports = { getServices };
