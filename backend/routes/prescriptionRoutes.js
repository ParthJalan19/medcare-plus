const express = require('express');
const {
  getPrescriptions,
  getMyPrescriptions,
  createPrescription
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.get('/my-prescriptions', authorize('patient'), getMyPrescriptions);

router.route('/')
  .get(authorize('admin', 'doctor', 'pharmacist'), getPrescriptions)
  .post(authorize('doctor'), validateSchema(schemas.prescription), createPrescription);

module.exports = router;
