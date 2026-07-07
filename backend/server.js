const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Developer request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS Configuration - support credentials (HTTP-only cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins for local/testing convenience or configure specifically
      callback(null, true);
    },
    credentials: true
  })
);

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend SPA files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));

// Placeholder stub API routes for other resources (will expand in subsequent milestones)
app.use('/api/v1/patients', require('./routes/patientRoutes'));
app.use('/api/v1/doctors', require('./routes/doctorRoutes'));
app.use('/api/v1/appointments', require('./routes/appointmentRoutes'));
app.use('/api/v1/medical-records', require('./routes/medicalRecordRoutes'));
app.use('/api/v1/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/v1/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/v1/laboratory', require('./routes/laboratoryRoutes'));
app.use('/api/v1/billing', require('./routes/billingRoutes'));
app.use('/api/v1/staff', require('./routes/staffRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));

// SPA routing fallback: serve index.html for any unhandled routes so client-side history router works
app.get('*', (req, res, next) => {
  // If it's an API request, let it go to 404
  if (req.url.startsWith('/api/v1/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  // Otherwise, serve frontend index.html
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
