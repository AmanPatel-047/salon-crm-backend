const Staff = require('../models/Staff');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/staff — Salon Owner / Receptionist
 * List staff scoped to the authenticated user's salon.
 */
const getStaff = async (req, res) => {
  try {
    const salonId = req.salonId;
    const { search, page = 1, limit = 20 } = req.query;

    const filter = { salonId, isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Staff.countDocuments(filter);
    const staff = await Staff.find(filter)
      .populate('userId', 'name email')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return success(res, {
      staff,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    }, 'Staff retrieved');
  } catch (err) {
    console.error('Get staff error:', err);
    return error(res, 'Failed to retrieve staff.', 500);
  }
};

/**
 * POST /api/staff — Salon Owner only
 * Create a new staff member, optionally with a user account.
 */
const createStaff = async (req, res) => {
  try {
    const { name, email, phone, specialization, createAccount, password } = req.body;
    const salonId = req.salonId;

    if (!name) {
      return error(res, 'Staff name is required.', 400);
    }

    let userId = null;

    // Optionally create a user account for the staff (receptionist role)
    if (createAccount && email && password) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return error(res, 'A user with this email already exists.', 409);
      }

      const user = await User.create({
        name,
        email,
        password,
        role: ROLES.RECEPTIONIST,
        salonId,
      });
      userId = user._id;
    }

    const staff = await Staff.create({
      name,
      email,
      phone,
      specialization,
      userId,
      salonId,
    });

    return success(res, staff, 'Staff created successfully', 201);
  } catch (err) {
    console.error('Create staff error:', err);
    return error(res, err.message, 500);
  }
};

module.exports = { getStaff, createStaff };
