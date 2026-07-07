const express = require('express');
const {
  getMetrics,
  getActivityLogs,
  exportExcel,
  exportPDF
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Download links pass tokens in query params
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

// JSON APIs require authorization headers
router.use(protect);

router.get('/metrics', authorize('admin', 'doctor', 'receptionist', 'nurse', 'lab', 'pharmacist'), getMetrics);
router.get('/activity-logs', authorize('admin', 'doctor', 'receptionist', 'nurse', 'lab', 'pharmacist'), getActivityLogs);

module.exports = router;
