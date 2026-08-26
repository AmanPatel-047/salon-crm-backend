const Plan = require('../models/Plan');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/plans — Super Admin only
 * Create a new subscription plan.
 */
const createPlan = async (req, res) => {
  try {
    const { name, price, durationInDays, maxStaff, maxAppointments } = req.body;

    if (!name || price == null || !durationInDays || !maxStaff || !maxAppointments) {
      return error(res, 'All fields are required: name, price, durationInDays, maxStaff, maxAppointments.', 400);
    }

    const plan = await Plan.create({
      name,
      price,
      durationInDays,
      maxStaff,
      maxAppointments,
    });

    return success(res, plan, 'Plan created successfully', 201);
  } catch (err) {
    console.error('Create plan error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/plans — Super Admin only
 * List all plans.
 */
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ createdAt: -1 });
    return success(res, plans, 'Plans retrieved');
  } catch (err) {
    console.error('Get plans error:', err);
    return error(res, 'Failed to retrieve plans.', 500);
  }
};

/**
 * PUT /api/plans/:id — Super Admin only
 * Update a plan.
 */
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return error(res, 'Plan not found.', 404);
    }

    return success(res, plan, 'Plan updated successfully');
  } catch (err) {
    console.error('Update plan error:', err);
    return error(res, err.message, 500);
  }
};

module.exports = { createPlan, getPlans, updatePlan };
