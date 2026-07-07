const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Get all lab tests
// @route   GET /api/v1/laboratory
// @access  Private (Admin, Doctor, Lab)
exports.getLabTests = async (req, res, next) => {
  try {
    const query = {};

    // Doctors see what they ordered. Lab staff/Admin see all.
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (doctorProfile) {
        query.doctor = doctorProfile._id;
      }
    }

    const tests = await LabTest.find(query)
      .populate('patient', 'name DOB contact bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ orderedDate: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's own lab tests
// @route   GET /api/v1/laboratory/my-tests
// @access  Private (Patient role only)
exports.getMyLabTests = async (req, res, next) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const tests = await LabTest.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name specialization' }
      })
      .sort({ orderedDate: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Order a lab test
// @route   POST /api/v1/laboratory
// @access  Private (Admin, Doctor, Lab)
exports.createLabTest = async (req, res, next) => {
  try {
    const { patient: patientId, testType } = req.body;

    let doctorId;
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (doctorProfile) doctorId = doctorProfile._id;
    } else {
      // Find a default doctor or let admin pass it (we will find the first doctor in system as backup)
      const doc = await Doctor.findOne();
      if (doc) doctorId = doc._id;
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'No physicians registered to order lab tests' });
    }

    const test = await LabTest.create({
      patient: patientId,
      doctor: doctorId,
      testType,
      status: 'ordered',
      orderedDate: Date.now()
    });

    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab test status
// @route   PATCH /api/v1/laboratory/:id/status
// @access  Private (Admin, Lab)
exports.updateLabTestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['ordered', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid lab status' });
    }

    let test = await LabTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Lab test order not found' });
    }

    test.status = status;
    if (status === 'completed') {
      test.completedDate = Date.now();
    }
    await test.save();

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload PDF result & mark completed
// @route   POST /api/v1/laboratory/:id/results
// @access  Private (Admin, Lab)
exports.uploadLabResults = async (req, res, next) => {
  try {
    let test = await LabTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'Lab test order not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF results file' });
    }

    test.status = 'completed';
    test.resultFile = `uploads/${req.file.filename}`;
    test.completedDate = Date.now();
    await test.save();

    res.status(200).json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};
