const Client = require('../models/Client');
const { success, error } = require('../utils/apiResponse');

/**
 * GET /api/clients — Salon Owner / Receptionist
 * List clients scoped to the authenticated user's salon.
 */
const getClients = async (req, res) => {
  try {
    const salonId = req.salonId;
    const { search, page = 1, limit = 20 } = req.query;

    const filter = { salonId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return success(res, {
      clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    }, 'Clients retrieved');
  } catch (err) {
    console.error('Get clients error:', err);
    return error(res, 'Failed to retrieve clients.', 500);
  }
};

/**
 * POST /api/clients — Salon Owner / Receptionist
 * Create a new client scoped to the authenticated user's salon.
 */
const createClient = async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;
    const salonId = req.salonId;

    if (!name || !phone) {
      return error(res, 'Name and phone are required.', 400);
    }

    const client = await Client.create({
      name,
      email,
      phone,
      notes,
      salonId,
    });

    return success(res, client, 'Client created successfully', 201);
  } catch (err) {
    console.error('Create client error:', err);
    return error(res, err.message, 500);
  }
};


/**
 * GET /api/clients/:id — Salon Owner / Receptionist
 * Get a specific client scoped to the authenticated user's salon.
 */
const getClientById = async (req, res) => {
  try {
    const salonId = req.salonId;
    const client = await Client.findOne({ _id: req.params.id, salonId });
    
    if (!client) {
      return error(res, 'Client not found.', 404);
    }
    
    return success(res, client, 'Client retrieved');
  } catch (err) {
    console.error('Get client by ID error:', err);
    return error(res, 'Failed to retrieve client.', 500);
  }
};

module.exports = { getClients, getClientById, createClient };
