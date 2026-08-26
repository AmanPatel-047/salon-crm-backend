const Salon = require('../models/Salon');
const Plan = require('../models/Plan');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const { SUBSCRIPTION_STATUS, SUBSCRIPTION_ACTIONS } = require('../config/constants');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/subscriptions/assign — Super Admin
 * Assign a plan to a salon for the first time.
 */
const assignPlan = async (req, res) => {
  try {
    const { salonId, planId } = req.body;

    if (!salonId || !planId) {
      return error(res, 'salonId and planId are required.', 400);
    }

    const salon = await Salon.findById(salonId);
    if (!salon) return error(res, 'Salon not found.', 404);

    const plan = await Plan.findById(planId);
    if (!plan) return error(res, 'Plan not found.', 404);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    // Update salon subscription
    salon.currentPlan = plan._id;
    salon.subscriptionStartDate = startDate;
    salon.subscriptionEndDate = endDate;
    salon.subscriptionStatus = SUBSCRIPTION_STATUS.ACTIVE;
    await salon.save();

    // Create subscription history record
    await SubscriptionHistory.create({
      salonId: salon._id,
      planId: plan._id,
      startDate,
      endDate,
      price: plan.price,
      action: SUBSCRIPTION_ACTIONS.ASSIGN,
      createdBy: req.user._id,
    });

    const updatedSalon = await Salon.findById(salonId)
      .populate('currentPlan', 'name price durationInDays maxStaff maxAppointments');

    return success(res, updatedSalon, 'Plan assigned successfully');
  } catch (err) {
    console.error('Assign plan error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/subscriptions/renew — Super Admin
 * Renew a salon's existing plan.
 */
const renewPlan = async (req, res) => {
  try {
    const { salonId } = req.body;

    if (!salonId) {
      return error(res, 'salonId is required.', 400);
    }

    const salon = await Salon.findById(salonId).populate('currentPlan');
    if (!salon) return error(res, 'Salon not found.', 404);
    if (!salon.currentPlan) return error(res, 'Salon has no plan to renew. Assign a plan first.', 400);

    const plan = salon.currentPlan;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    salon.subscriptionStartDate = startDate;
    salon.subscriptionEndDate = endDate;
    salon.subscriptionStatus = SUBSCRIPTION_STATUS.ACTIVE;
    await salon.save();

    await SubscriptionHistory.create({
      salonId: salon._id,
      planId: plan._id,
      startDate,
      endDate,
      price: plan.price,
      action: SUBSCRIPTION_ACTIONS.RENEW,
      createdBy: req.user._id,
    });

    return success(res, salon, 'Plan renewed successfully');
  } catch (err) {
    console.error('Renew plan error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/subscriptions/upgrade — Super Admin
 * Upgrade a salon to a different plan.
 */
const upgradePlan = async (req, res) => {
  try {
    const { salonId, planId } = req.body;

    if (!salonId || !planId) {
      return error(res, 'salonId and planId are required.', 400);
    }

    const salon = await Salon.findById(salonId);
    if (!salon) return error(res, 'Salon not found.', 404);

    const plan = await Plan.findById(planId);
    if (!plan) return error(res, 'Plan not found.', 404);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    salon.currentPlan = plan._id;
    salon.subscriptionStartDate = startDate;
    salon.subscriptionEndDate = endDate;
    salon.subscriptionStatus = SUBSCRIPTION_STATUS.ACTIVE;
    await salon.save();

    await SubscriptionHistory.create({
      salonId: salon._id,
      planId: plan._id,
      startDate,
      endDate,
      price: plan.price,
      action: SUBSCRIPTION_ACTIONS.UPGRADE,
      createdBy: req.user._id,
    });

    const updatedSalon = await Salon.findById(salonId)
      .populate('currentPlan', 'name price durationInDays maxStaff maxAppointments');

    return success(res, updatedSalon, 'Plan upgraded successfully');
  } catch (err) {
    console.error('Upgrade plan error:', err);
    return error(res, err.message, 500);
  }
};

/**
 * GET /api/subscriptions/history/:salonId — Super Admin
 * Get subscription history for a salon.
 */
const getHistory = async (req, res) => {
  try {
    const history = await SubscriptionHistory.find({ salonId: req.params.salonId })
      .populate('planId', 'name price durationInDays')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return success(res, history, 'Subscription history retrieved');
  } catch (err) {
    console.error('Get history error:', err);
    return error(res, 'Failed to retrieve subscription history.', 500);
  }
};

/**
 * GET /api/subscriptions/status — Salon Owner
 * Get own salon's subscription status.
 */
const getMySubscriptionStatus = async (req, res) => {
  try {
    const salon = await Salon.findById(req.salonId)
      .populate('currentPlan', 'name price durationInDays maxStaff maxAppointments');

    if (!salon) return error(res, 'Salon not found.', 404);

    const subscriptionData = {
      salonName: salon.name,
      currentPlan: salon.currentPlan,
      subscriptionStartDate: salon.subscriptionStartDate,
      subscriptionEndDate: salon.subscriptionEndDate,
      subscriptionStatus: salon.subscriptionStatus,
      daysRemaining: salon.subscriptionEndDate
        ? Math.max(0, Math.ceil((new Date(salon.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0,
    };

    return success(res, subscriptionData, 'Subscription status retrieved');
  } catch (err) {
    console.error('Get subscription status error:', err);
    return error(res, 'Failed to retrieve subscription status.', 500);
  }
};

module.exports = { assignPlan, renewPlan, upgradePlan, getHistory, getMySubscriptionStatus };
