const express = require('express');
const router = express.Router();
const { getSalons, getSalonById, createSalon, getMySalonSettings, updateMySalonSettings } = require('../controllers/salonController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

// Owner specific routes
router.get('/settings/my', authenticate, authorize(ROLES.SALON_OWNER), getMySalonSettings);
router.put('/settings/my', authenticate, authorize(ROLES.SALON_OWNER), updateMySalonSettings);

// All other salon management routes require super_admin role
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/', getSalons);
router.get('/:id', getSalonById);
router.post('/', createSalon);

module.exports = router;
