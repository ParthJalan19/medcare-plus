const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

// @desc    Get all medical records
// @route   GET /api/v1/medical-records
// @access  Private (Admin, Doctor, Nurse)
exports.getMedicalRecords = async (req, res, next) => {
  try {
    const query = {};

    // If active user is a Doctor, list patient records they consulted
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (doctorProfile) {
        query.doctor = doctorProfile._id;
      }
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'name DOB gender contact')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in patient's own medical records
// @route   GET /api/v1/medical-records/my-records
// @access  Private (Patient role only)
exports.getMyRecords = async (req, res, next) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const records = await MedicalRecord.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create medical record
// @route   POST /api/v1/medical-records
// @access  Private (Doctor only)
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const { patient, diagnosis, treatment, visitDate } = req.body;

    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(403).json({ success: false, error: 'Doctor profile required to log EMR clinical history' });
    }

    // Process files if uploaded via multer
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`uploads/${file.filename}`);
      });
    }

    const record = await MedicalRecord.create({
      patient,
      doctor: doctorProfile._id,
      diagnosis,
      treatment,
      attachments,
      visitDate: visitDate || Date.now()
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medical record
// @route   PATCH /api/v1/medical-records/:id
// @access  Private (Doctor only)
exports.updateMedicalRecord = async (req, res, next) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Medical record not found' });
    }

    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile || record.doctor.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this medical record' });
    }

    record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};
