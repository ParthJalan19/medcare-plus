const express = require('express');
const {
  getAppointments,
  getMyAppointments,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.get('/my-appointments', authorize('patient'), getMyAppointments);
router.get('/available-slots', getAvailableSlots);

router.route('/')
  .get(authorize('admin', 'doctor', 'receptionist', 'nurse'), getAppointments)
  .post(authorize('patient', 'admin', 'receptionist', 'doctor'), validateSchema(schemas.appointment), createAppointment);

router.route('/:id/status')
  .patch(authorize('admin', 'receptionist', 'doctor', 'nurse'), updateAppointmentStatus);

module.exports = router;
