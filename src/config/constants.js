const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SALON_OWNER: 'salon_owner',
  RECEPTIONIST: 'receptionist',
};

const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  NONE: 'none',
};

const SUBSCRIPTION_ACTIONS = {
  ASSIGN: 'ASSIGN',
  RENEW: 'RENEW',
  UPGRADE: 'UPGRADE',
};

const ATTENDANCE_STATUS = {
  CHECKED_IN: 'checked_in',
  REJECTED: 'rejected',
};

// Default salon working hours
const WORKING_HOURS = {
  OPENING: '09:00',
  CLOSING: '20:00',
};

// Default services with durations in minutes
const DEFAULT_SERVICES = [
  { name: 'Haircut', duration: 30, price: 500 },
  { name: 'Facial', duration: 60, price: 1500 },
  { name: 'Hair Color', duration: 120, price: 3000 },
];

module.exports = {
  ROLES,
  APPOINTMENT_STATUS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_ACTIONS,
  ATTENDANCE_STATUS,
  WORKING_HOURS,
  DEFAULT_SERVICES,
};
