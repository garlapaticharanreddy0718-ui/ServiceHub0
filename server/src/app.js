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
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middlewares
const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || localOriginRegex.test(origin)) {
      return callback(null, true);
    }
    const configuredOrigins = config.corsOrigin ? config.corsOrigin.split(',').map((o) => o.trim()) : [];
    if (configuredOrigins.includes(origin)) {
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
app.use('/api/v1/businesses/:businessId', serviceRoutes);
app.use('/api/v1/businesses/:businessId', staffRoutes);
app.use('/api/v1/businesses/:businessId', customerRoutes);
app.use('/api/v1/businesses/:businessId', bookingRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
