const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, getTodayAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { checkSubscription } = require('../middleware/subscription');
const { ROLES } = require('../config/constants');

// All appointment routes: authenticated + salon role + subscription active
router.use(authenticate, authorize(ROLES.SALON_OWNER, ROLES.RECEPTIONIST), checkSubscription);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
