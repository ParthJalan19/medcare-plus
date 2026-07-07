const Patient = require('../models/Patient');

// @desc    Get all patients
// @route   GET /api/v1/patients
// @access  Private (Admin, Doctor, Receptionist, Nurse)
exports.getPatients = async (req, res, next) => {
  try {
    const { search, gender, bloodGroup, page = 1, limit = 100 } = req.query;

    const query = {};

    // Search filter (name or contact)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }

    // Gender filter
    if (gender) {
      query.gender = gender;
    }

    // Blood Group filter
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('user', 'name email phone avatar')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient
// @route   GET /api/v1/patients/:id
// @access  Private (Admin, Doctor, Receptionist, Nurse)
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('user', 'name email phone');

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in patient's profile
// @route   GET /api/v1/patients/me
// @access  Private (Patient role)
exports.getMyProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found for this user' });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create patient
// @route   POST /api/v1/patients
// @access  Private (Admin, Receptionist, Doctor, Nurse)
exports.createPatient = async (req, res, next) => {
  try {
    const { name, DOB, gender, bloodGroup, contact, address, emergencyContact, allergies } = req.body;

    const patient = await Patient.create({
      name,
      DOB,
      gender,
      bloodGroup: bloodGroup || 'unknown',
      contact,
      address,
      emergencyContact,
      allergies: allergies || []
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PATCH /api/v1/patients/:id
// @access  Private (Admin, Receptionist, Doctor, Nurse)
exports.updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/v1/patients/:id
// @access  Private (Admin only)
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    // Delete linked user if any
    if (patient.user) {
      const User = require('../models/User');
      await User.findByIdAndDelete(patient.user);
    }

    await Patient.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
