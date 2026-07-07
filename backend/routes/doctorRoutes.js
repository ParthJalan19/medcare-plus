const express = require('express');
const {
  getDoctors,
  getDoctor,
  getDepartments,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require auth
router.use(protect);

router.get('/departments', getDepartments);

router.route('/')
  .get(getDoctors)
  .post(authorize('admin'), validateSchema(schemas.doctor), createDoctor);

router.route('/:id')
  .get(getDoctor)
  .patch(authorize('admin'), validateSchema(schemas.doctor), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

module.exports = router;
