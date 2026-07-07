const express = require('express');
const {
  getMedicines,
  createMedicine,
  getInventory,
  createInventoryBatch
} = require('../controllers/pharmacyController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.route('/medicines')
  .get(authorize('admin', 'doctor', 'pharmacist'), getMedicines)
  .post(authorize('admin', 'pharmacist'), validateSchema(schemas.medicine), createMedicine);

router.route('/inventory')
  .get(authorize('admin', 'pharmacist'), getInventory)
  .post(authorize('admin', 'pharmacist'), validateSchema(schemas.inventory), createInventoryBatch);

module.exports = router;
