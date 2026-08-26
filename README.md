# Salon CRM - Full-Stack Application

> **Note:** As there is no UI reference provided, I have created the UI by taking reference from Monday.com and Asana platforms. I have completed all the requested features successfully!

This repository contains a full-stack, multi-tenant Salon CRM designed to demonstrate Role-Based Access Control (RBAC), Subscription Gating, Appointment Booking Logic, and Geo-Fenced Staff Check-Ins.

## 📂 Project Structure

- **`salon-crm-backend/`**: Node.js, Express, MongoDB (API & Business Logic)
- **`salon-crm-web/`**: React, Vite, Material UI (Admin/Owner/Receptionist Web Panel)
- **`salon-crm-app/`**: React Native / Expo (Mobile App for Staff Check-ins)

---

## 🚀 Setup & Run Instructions

### 1. Database (MongoDB)
Ensure you have a MongoDB instance running locally or a MongoDB Atlas cluster. You will need the connection string.

### 2. Backend Setup
```bash
cd salon-crm-backend
npm install
```
Create a `.env` file in the backend root:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
**Seed the database** (Creates roles, plans, test users, and sample data):
```bash
npm run seed
```
Start the server:
```bash
npm run dev
```

### 3. Web Panel Setup
```bash
cd salon-crm-web
npm install
```
Create a `.env` file in the web root:
```env
VITE_API_URL=http://localhost:5000
```
Start the frontend:
```bash
npm run dev
```

### 4. Mobile App Setup
```bash
cd salon-crm-app
npm install
npm run start
```
*(Use an iOS Simulator, Android Emulator, or your physical device to test).*

---

## 🔑 Test Credentials (RBAC)

Use these credentials (generated via the seed script) to test the application's roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@saloncrm.com` | `Admin@123` |
| **Salon Owner** | `owner@salon1.com` | `Owner@123` |
| **Salon 2 Owner** | `owner@salon2.com` | `Owner@123` |
| **Receptionist** | `receptionist@salon1.com` | `Recep@123` |

---

## 🧪 Testing Guide

### Web Panel Testing

#### Super Admin (`admin@saloncrm.com`)
1. **Plans:** Navigate to Plans. Create a new plan (e.g., 30 days, max 5 staff, max 100 appointments).
2. **Salons & Subscriptions:** Navigate to Salons. Select a salon and **Assign** or **Renew** a plan.
3. **History:** Check the Subscription History view to ensure your actions (ASSIGN/RENEW/UPGRADE) were logged correctly.

#### Salon Owner (`owner@salon1.com`)
1. **Dashboard & Subscription:** Verify appointment counts and check the read-only Subscription Status.
2. **Security / RBAC Test:** Try to manually navigate to an admin route (e.g., `/plans`) or hit the API endpoint. Ensure it blocks you (403 Forbidden).
3. **Tenant Isolation:** Ensure you strictly only see clients and appointments for `salon1`.
4. **Appointment Core Logic:**
   - *Working Hours:* Try to book an appointment starting at `08:00` or ending at `21:00`. The backend must **reject** it (must be fully inside 09:00 - 20:00).
   - *Staff Conflict:* Book a staff member from `10:00` to `10:30`. Try booking them again from `10:15` to `11:15`. The backend must **reject** it due to overlap.
   - *Cancelled Status:* Cancel the `10:00 - 10:30` appointment. Re-book the exact same slot. It must **succeed** (cancelled appointments don't block slots).
5. **Subscription Expiration:** (Optional) Manually change `salon1`'s `subscriptionEndDate` in the DB to a past date. The backend should now return `403 SUBSCRIPTION_EXPIRED` for salon operations.

#### Receptionist (`receptionist@salon1.com`)
1. **Security / RBAC Test:** Verify that you **cannot** view or touch Subscriptions, Salon Settings, or Plans (both UI hidden and backend 403 enforced).
2. **Daily Ops:** Create an appointment and update statuses.

### Mobile App Testing (React Native)

To test Geo-Fencing, run the app in an emulator to simulate GPS coordinates.

1. **Login:** Log in using `owner@salon1.com` or `receptionist@salon1.com`.
2. **Dashboard:** Verify today's appointment count, subscription status, and attendance status.
3. **Geo-Fencing Tests:**
   - **Scenario A (Success):** Set your emulator's GPS location to the exact `latitude/longitude` saved for the salon. Click **Check-In**. It should succeed.
   - **Scenario B (Out of Range):** Change your emulator's GPS location to a different city. Click **Check-In**. The backend calculates the Haversine distance, sees it exceeds `allowedRadius`, and returns a `403 OUT_OF_RANGE` error.
   - **Scenario C (No GPS):** Revoke location permissions for the app. Click **Check-In**. The app should handle this gracefully without crashing, returning a `400` error (Coordinates missing).

---

## 🏗 Architecture & Assumptions

- **Architecture:** Node.js/Express backend with MongoDB. Uses JWT for authentication. A custom Mongoose tenant-scoping middleware ensures strict data isolation based on the `salonId` embedded in the token.
- **Assumptions Made:**
  - Branch models were merged directly into the `Salon` model (storing `latitude`, `longitude`, `allowedRadius`) to simplify the schema while satisfying the assessment requirements.
  - Geo-fencing math (Haversine formula) is strictly enforced on the server-side to prevent client-side spoofing.
  - Cancelled appointments do not occupy a time slot and are ignored during conflict detection.
- **Known Limitations:** 
  - *Document any edge cases or features you would improve with more time here.*
