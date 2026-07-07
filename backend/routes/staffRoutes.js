const express = require('express');
const {
  getStaff,
  createStaff,
  toggleStaffActive
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getStaff)
  .post(validateSchema(schemas.staff), createStaff);

router.route('/:id/toggle-active')
  .patch(toggleStaffActive);

module.exports = router;
