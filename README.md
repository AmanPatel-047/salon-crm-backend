# SalonCRM Backend

Professional, robust, and scalable backend API for the SalonCRM multi-tenant platform. Built with Node.js, Express, and MongoDB.

## Features

- **Multi-tenant Architecture:** Data is isolated per salon seamlessly using tenant scoping in Mongoose and JWT claims.
- **Role-Based Access Control (RBAC):** Distinct permissions for Super Admin, Salon Owner, and Receptionist.
- **Subscription Gating:** Middleware enforces subscription limits and active statuses on salon-level routes.
- **Geo-fencing:** Server-side Haversine formula calculation for staff attendance check-in validating distance to the salon.
- **Conflict Prevention:** Business logic prevents overlapping appointments for the same staff member and strictly enforces salon business hours.
- **Vercel Serverless Ready:** Pre-configured vercel.json and optimized MongoDB connection caching for serverless environments.

## Architecture

- **src/models/**: Mongoose schemas defining the data structure (User, Salon, Plan, SubscriptionHistory, Appointment, Service, Staff, Client, Attendance).
- **src/controllers/**: Core business logic.
- **src/routes/**: Express route definitions.
- **src/middleware/**: auth.js (JWT validation), authorize.js (Role checks), subscription.js (Plan status gating).
- **src/utils/**: Helper utilities like haversine.js and timeUtils.js.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas (or local MongoDB)

### Environment Variables
Create a .env file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Installation
```bash
npm install
```

### Seeding the Database
To populate the database with default roles, plans, test users, and dummy data:
```bash
npm run seed
```

### Running the Server
```bash
# Development
npm run dev

# Production
npm start
```

## Deployment (Vercel)

The project is optimized for deployment to Vercel as serverless functions.
1. Connect your GitHub repository to Vercel.
2. Ensure the Framework Preset is Other.
3. Add your Environment Variables (MONGODB_URI, JWT_SECRET).
4. Deploy! Vercel will automatically read vercel.json and route /api/* to the api/index.js file.

---
*Built as part of a Full-Stack Developer Technical Assessment.*
