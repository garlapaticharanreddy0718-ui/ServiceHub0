const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const staffRoutes = require('./routes/staffRoutes');
const customerRoutes = require('./routes/customerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const { authenticate } = require('./middleware/authMiddleware');
const { requireBusinessMember } = require('./middleware/rbacMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (Render) so secure cookies and protocol headers work properly
app.set('trust proxy', 1);

// Middlewares
const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || localOriginRegex.test(origin)) {
      return callback(null, true);
    }
    const configuredOrigins = config.corsOrigin
      ? config.corsOrigin.split(',').map((o) => o.trim().replace(/\/+$/, ''))
      : [];
    if (configuredOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Version 1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/owner', ownerRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/businesses', businessRoutes);

// Business-scoped resource routes: authenticate and verify membership once per request
const businessScopedRouter = express.Router({ mergeParams: true });
businessScopedRouter.use(authenticate);
businessScopedRouter.use(requireBusinessMember);
businessScopedRouter.use(serviceRoutes);
businessScopedRouter.use(staffRoutes);
businessScopedRouter.use(customerRoutes);
businessScopedRouter.use(bookingRoutes);
app.use('/api/v1/businesses/:businessId', businessScopedRouter);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
