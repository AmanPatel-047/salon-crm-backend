require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Plan = require('../models/Plan');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const { ROLES, SUBSCRIPTION_STATUS, SUBSCRIPTION_ACTIONS, APPOINTMENT_STATUS, DEFAULT_SERVICES } = require('../config/constants');

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Salon.deleteMany({}),
      Plan.deleteMany({}),
      SubscriptionHistory.deleteMany({}),
      Client.deleteMany({}),
      Staff.deleteMany({}),
      Service.deleteMany({}),
      Appointment.deleteMany({}),
    ]);
    console.log('Cleared existing data.\n');

    // 1. Create Plans
    const basicPlan = await Plan.create({
      name: 'Basic',
      price: 999,
      durationInDays: 30,
      maxStaff: 3,
      maxAppointments: 50,
    });

    const professionalPlan = await Plan.create({
      name: 'Professional',
      price: 2499,
      durationInDays: 30,
      maxStaff: 5,
      maxAppointments: 100,
    });

    const enterprisePlan = await Plan.create({
      name: 'Enterprise',
      price: 4999,
      durationInDays: 30,
      maxStaff: 15,
      maxAppointments: 500,
    });

    console.log('Plans created: Basic, Professional, Enterprise');

    // 2. Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@saloncrm.com',
      password: 'Admin@123',
      role: ROLES.SUPER_ADMIN,
      salonId: null,
    });
    console.log('Super Admin created: admin@saloncrm.com / Admin@123');

    // 3. Create Salon Owner
    const salonOwner = await User.create({
      name: 'Aman Patel',
      email: 'owner@salon1.com',
      password: 'Owner@123',
      role: ROLES.SALON_OWNER,
    });

    // 4. Create Salon (Mumbai coordinates)
    const salon = await Salon.create({
      name: 'Glamour Studio',
      address: '123 Fashion Street, Mumbai, Maharashtra 400001',
      phone: '+91 9876543210',
      email: 'info@glamourstudio.com',
      ownerId: salonOwner._id,
      latitude: 22.728796,
      longitude: 75.879427,
      allowedRadius: 100,
      openingTime: '09:00',
      closingTime: '20:00',
      currentPlan: professionalPlan._id,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
    });

    // Link owner to salon
    salonOwner.salonId = salon._id;
    await salonOwner.save();
    console.log('Salon Owner created: owner@salon1.com / Owner@123');
    console.log(`Salon created: "${salon.name}" (${salon._id})`);

    // 5. Create Subscription History
    await SubscriptionHistory.create({
      salonId: salon._id,
      planId: professionalPlan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      price: professionalPlan.price,
      action: SUBSCRIPTION_ACTIONS.ASSIGN,
      createdBy: superAdmin._id,
    });

    // 6. Create Receptionist
    const receptionist = await User.create({
      name: 'Priya Sharma',
      email: 'receptionist@salon1.com',
      password: 'Recep@123',
      role: ROLES.RECEPTIONIST,
      salonId: salon._id,
    });
    console.log('Receptionist created: receptionist@salon1.com / Recep@123');

    // 7. Create Services
    const services = await Service.insertMany(
      DEFAULT_SERVICES.map((s) => ({ ...s, salonId: salon._id }))
    );
    console.log(`Services created: ${services.map((s) => s.name).join(', ')}`);

    // 8. Create Staff
    const staff1 = await Staff.create({
      name: 'Raj Kumar',
      email: 'raj@glamourstudio.com',
      phone: '+91 9876543211',
      specialization: 'Hair Stylist',
      salonId: salon._id,
    });

    const staff2 = await Staff.create({
      name: 'Priya Sharma',
      email: 'receptionist@salon1.com',
      phone: '+91 9876543212',
      specialization: 'Beautician',
      userId: receptionist._id,
      salonId: salon._id,
    });

    console.log('Staff created: Raj Kumar, Priya Sharma');

    // 9. Create Clients
    const client1 = await Client.create({
      name: 'Sneha Reddy',
      email: 'sneha@example.com',
      phone: '+91 9876543213',
      notes: 'Prefers organic products',
      salonId: salon._id,
    });

    const client2 = await Client.create({
      name: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '+91 9876543214',
      salonId: salon._id,
    });

    const client3 = await Client.create({
      name: 'Anjali Menon',
      email: 'anjali@example.com',
      phone: '+91 9876543215',
      notes: 'Allergic to certain hair dyes',
      salonId: salon._id,
    });

    console.log('Clients created: Sneha, Vikram, Anjali');

    // 10. Create Sample Appointments (today and upcoming)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Appointment.insertMany([
      {
        clientId: client1._id,
        serviceId: services[0]._id, // Haircut
        staffId: staff1._id,
        salonId: salon._id,
        date: today,
        startTime: '10:00',
        endTime: '10:30',
        status: APPOINTMENT_STATUS.CONFIRMED,
      },
      {
        clientId: client2._id,
        serviceId: services[1]._id, // Facial
        staffId: staff2._id,
        salonId: salon._id,
        date: today,
        startTime: '11:00',
        endTime: '12:00',
        status: APPOINTMENT_STATUS.PENDING,
      },
      {
        clientId: client3._id,
        serviceId: services[2]._id, // Hair Color
        staffId: staff1._id,
        salonId: salon._id,
        date: today,
        startTime: '14:00',
        endTime: '16:00',
        status: APPOINTMENT_STATUS.PENDING,
      },
      {
        clientId: client1._id,
        serviceId: services[0]._id,
        staffId: staff2._id,
        salonId: salon._id,
        date: tomorrow,
        startTime: '09:00',
        endTime: '09:30',
        status: APPOINTMENT_STATUS.PENDING,
      },
      {
        clientId: client2._id,
        serviceId: services[1]._id,
        staffId: staff1._id,
        salonId: salon._id,
        date: today,
        startTime: '09:00',
        endTime: '10:00',
        status: APPOINTMENT_STATUS.CANCELLED,
        notes: 'Client cancelled',
      },
    ]);

    console.log('Sample appointments created (5 appointments)');

    
    // === SECOND SALON ===
    const salonOwner2 = await User.create({
      name: 'Riya Kapoor',
      email: 'owner@salon2.com',
      password: 'Owner@123',
      role: ROLES.SALON_OWNER,
    });
    const salon2 = await Salon.create({
      name: 'Urban Cuts',
      address: '456 Modern Ave, Delhi 110001',
      phone: '+91 9876543220',
      email: 'info@urbancuts.com',
      ownerId: salonOwner2._id,
      latitude: 22.728796,
      longitude: 75.879427,
      allowedRadius: 100,
      openingTime: '10:00',
      closingTime: '21:00',
      currentPlan: basicPlan._id,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
    });
    salonOwner2.salonId = salon2._id;
    await salonOwner2.save();

    await SubscriptionHistory.create({
      salonId: salon2._id,
      planId: basicPlan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      price: basicPlan.price,
      action: SUBSCRIPTION_ACTIONS.ASSIGN,
      createdBy: superAdmin._id,
    });

    const services2 = await Service.insertMany(
      DEFAULT_SERVICES.map((s) => ({ ...s, salonId: salon2._id }))
    );

    const staff3 = await Staff.create({
      name: 'Amit Singh',
      email: 'amit@urbancuts.com',
      phone: '+91 9876543221',
      specialization: 'Senior Stylist',
      salonId: salon2._id,
    });

    const client4 = await Client.create({
      name: 'Karan Malhotra',
      email: 'karan@example.com',
      phone: '+91 9876543222',
      salonId: salon2._id,
    });

    await Appointment.create({
      clientId: client4._id,
      serviceId: services2[0]._id,
      staffId: staff3._id,
      salonId: salon2._id,
      date: today,
      startTime: '12:00',
      endTime: '12:30',
      status: APPOINTMENT_STATUS.CONFIRMED,
    });

    console.log('Second salon (Urban Cuts) created with owner owner@salon2.com');
    // === END SECOND SALON ===

    console.log('\n========================================');
    console.log('   SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nTest Credentials:');
    console.log('  Super Admin:   admin@saloncrm.com      / Admin@123');
    console.log('  Salon Owner 1: owner@salon1.com         / Owner@123');
    console.log('  Salon Owner 2: owner@salon2.com         / Owner@123');
    console.log('  Receptionist:  receptionist@salon1.com  / Recep@123');
    console.log('\nSalon: Glamour Studio (Mumbai)');
    console.log('Plan: Professional (active, 30 days)');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
