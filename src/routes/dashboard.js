const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { checkSubscription } = require('../middleware/subscription');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.SALON_OWNER, ROLES.RECEPTIONIST), checkSubscription);

router.get('/', getDashboard);

module.exports = router;
