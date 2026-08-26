const express = require('express');
const router = express.Router();
const { createPlan, getPlans, updatePlan } = require('../controllers/planController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ROLES } = require('../config/constants');

// All plan routes require super_admin role
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.post('/', createPlan);
router.get('/', getPlans);
router.put('/:id', updatePlan);

module.exports = router;
