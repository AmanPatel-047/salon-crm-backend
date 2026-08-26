const express = require('express');
const router = express.Router();
const { checkIn, getAttendanceStatus } = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { checkSubscription } = require('../middleware/subscription');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.SALON_OWNER, ROLES.RECEPTIONIST), checkSubscription);

router.post('/check-in', checkIn);
router.get('/status', getAttendanceStatus);

module.exports = router;
