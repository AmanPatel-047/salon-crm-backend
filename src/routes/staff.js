const express = require('express');
const router = express.Router();
const { getStaff, createStaff } = require('../controllers/staffController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { checkSubscription } = require('../middleware/subscription');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.SALON_OWNER, ROLES.RECEPTIONIST), checkSubscription);

router.get('/', getStaff);
router.post('/', authenticate, authorize(ROLES.SALON_OWNER), createStaff);

module.exports = router;
