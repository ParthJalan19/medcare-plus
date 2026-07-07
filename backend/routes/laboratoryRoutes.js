const express = require('express');
const {
  getLabTests,
  getMyLabTests,
  createLabTest,
  updateLabTestStatus,
  uploadLabResults
} = require('../controllers/laboratoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/my-tests', authorize('patient'), getMyLabTests);

router.route('/')
  .get(authorize('admin', 'doctor', 'lab'), getLabTests)
  .post(authorize('admin', 'doctor', 'lab'), validateSchema(schemas.labTest), createLabTest);

router.route('/:id/status')
  .patch(authorize('admin', 'lab'), updateLabTestStatus);

router.route('/:id/results')
  .post(authorize('admin', 'lab'), upload.single('resultFile'), uploadLabResults);

module.exports = router;
