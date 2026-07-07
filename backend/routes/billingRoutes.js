const express = require('express');
const {
  getBills,
  getMyBills,
  createBill,
  payBill,
  getInvoicePDF
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

router.get('/:id/pdf', getInvoicePDF); // Token verified inside the controller

// Remaining routes require standard auth headers
router.use(protect);

router.get('/my-bills', authorize('patient'), getMyBills);

router.route('/')
  .get(authorize('admin', 'receptionist'), getBills)
  .post(authorize('admin', 'receptionist'), validateSchema(schemas.bill), createBill);

router.route('/:id/pay')
  .post(authorize('admin', 'receptionist', 'patient'), validateSchema(schemas.payment), payBill);

module.exports = router;
