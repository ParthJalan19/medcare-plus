const express = require('express');
const {
  getPatients,
  getPatient,
  getMyProfile,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require auth
router.use(protect);

router.get('/me', authorize('patient'), getMyProfile);

router.route('/')
  .get(authorize('admin', 'doctor', 'receptionist', 'nurse'), getPatients)
  .post(authorize('admin', 'receptionist', 'doctor', 'nurse'), validateSchema(schemas.patient), createPatient);

router.route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'nurse'), getPatient)
  .patch(authorize('admin', 'receptionist', 'doctor', 'nurse'), validateSchema(schemas.patient), updatePatient)
  .delete(authorize('admin'), deletePatient);

module.exports = router;
