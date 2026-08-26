require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('../src/config/database');
const { errorHandler } = require('../src/middleware/errorHandler');

// Import routes
const authRoutes = require('../src/routes/auth');
const planRoutes = require('../src/routes/plans');
const salonRoutes = require('../src/routes/salons');
const subscriptionRoutes = require('../src/routes/subscriptions');
const appointmentRoutes = require('../src/routes/appointments');
const clientRoutes = require('../src/routes/clients');
const staffRoutes = require('../src/routes/staff');
const attendanceRoutes = require('../src/routes/attendance');
const dashboardRoutes = require('../src/routes/dashboard');
const serviceRoutes = require('../src/routes/services');
const uploadRoutes = require('../src/routes/upload');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware - ORDER IS IMPORTANT
// 1. CORS should be first to handle preflight before other middleware blocks it
app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

// 2. Explicitly handle pre-flight requests for all routes
// app.options('/(.*)', cors());
app.options(/.*/, cors());

// 3. Security headers and body parsers
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Salon CRM API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`To access from other devices, use your local IP address.`);
  });
}

module.exports = app;