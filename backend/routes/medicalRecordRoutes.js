const express = require('express');
const {
  getMedicalRecords,
  getMyRecords,
  createMedicalRecord,
  updateMedicalRecord
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/my-records', authorize('patient'), getMyRecords);

router.route('/')
  .get(authorize('admin', 'doctor', 'nurse'), getMedicalRecords)
  .post(authorize('doctor'), upload.array('attachments', 5), createMedicalRecord);

router.route('/:id')
  .patch(authorize('doctor'), updateMedicalRecord);

module.exports = router;
