const Salon = require('../models/Salon');
const User = require('../models/User');
const Service = require('../models/Service');
const { ROLES, DEFAULT_SERVICES } = require('../config/constants');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/salons — Super Admin only
 * List all salons with owner info and subscription status.
 */
const getSalons = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Salon.countDocuments(filter);
    const salons = await Salon.find(filter)
      .populate('ownerId', 'name email')
      .populate('currentPlan', 'name price durationInDays maxStaff maxAppointments')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return success(res, {
      salons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    }, 'Salons retrieved');
  } catch (err) {
    console.error('Get salons error:', err);
    return error(res, 'Failed to retrieve salons.', 500);
  }
};

/**
 * GET /api/salons/:id — Super Admin only
 * Get salon details.
 */
const getSalonById = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('ownerId', 'name email')
      .populate('currentPlan', 'name price durationInDays maxStaff maxAppointments');

    if (!salon) {
      return error(res, 'Salon not found.', 404);
    }

    return success(res, salon, 'Salon retrieved');
  } catch (err) {
    console.error('Get salon error:', err);
    return error(res, 'Failed to retrieve salon.', 500);
  }
};

/**
 * POST /api/salons — Super Admin only
 * Create a new salon along with its owner user and default services.
 */
const createSalon = async (req, res) => {
  try {
    const { name, address, phone, email, latitude, longitude, allowedRadius, ownerName, ownerEmail, ownerPassword } = req.body;

    if (!name || !ownerName || !ownerEmail || !ownerPassword || latitude == null || longitude == null) {
      return error(res, 'Required fields: name, ownerName, ownerEmail, ownerPassword, latitude, longitude.', 400);
    }

    // Check if owner email already exists
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return error(res, 'A user with this email already exists.', 409, 'DUPLICATE_ERROR');
    }

    // Create salon owner user
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      role: ROLES.SALON_OWNER,
    });

    // Create salon
    const salon = await Salon.create({
      name,
      address,
      phone,
      email,
      latitude,
      longitude,
      allowedRadius: allowedRadius || 100,
      ownerId: owner._id,
    });

    // Link owner to salon
    owner.salonId = salon._id;
    await owner.save();

    // Create default services for the salon
    const services = DEFAULT_SERVICES.map((s) => ({
      ...s,
      salonId: salon._id,
    }));
    await Service.insertMany(services);

    const populatedSalon = await Salon.findById(salon._id)
      .populate('ownerId', 'name email');

    return success(res, populatedSalon, 'Salon created successfully', 201);
  } catch (err) {
    console.error('Create salon error:', err);
    return error(res, err.message, 500);
  }
};


/**
 * GET /api/salons/settings/my — Salon Owner only
 * Get current salon settings.
 */
const getMySalonSettings = async (req, res) => {
  try {
    const salon = await Salon.findById(req.salonId).select('-__v');
    if (!salon) return error(res, 'Salon not found.', 404);
    return success(res, salon, 'Salon settings retrieved');
  } catch (err) {
    console.error('Get my salon settings error:', err);
    return error(res, 'Failed to retrieve salon settings.', 500);
  }
};

/**
 * PUT /api/salons/settings/my — Salon Owner only
 * Update current salon settings.
 */
const updateMySalonSettings = async (req, res) => {
  try {
    const { name, address, phone, email, latitude, longitude, allowedRadius, openingTime, closingTime } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (allowedRadius !== undefined) updateData.allowedRadius = allowedRadius;
    if (openingTime !== undefined) updateData.openingTime = openingTime;
    if (closingTime !== undefined) updateData.closingTime = closingTime;

    const salon = await Salon.findByIdAndUpdate(
      req.salonId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!salon) return error(res, 'Salon not found.', 404);
    
    return success(res, salon, 'Salon settings updated successfully');
  } catch (err) {
    console.error('Update my salon settings error:', err);
    return error(res, 'Failed to update salon settings.', 500);
  }
};

module.exports = { getSalons, getSalonById, createSalon, getMySalonSettings, updateMySalonSettings };
