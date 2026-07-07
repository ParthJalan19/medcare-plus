const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Get all doctors
// @route   GET /api/v1/doctors
// @access  Private (All authenticated roles)
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email phone avatar')
      .populate('department', 'name description');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/v1/doctors/:id
// @access  Private (All authenticated roles)
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate('department', 'name description');

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all departments
// @route   GET /api/v1/doctors/departments
// @access  Private (All authenticated roles)
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().populate({
      path: 'headDoctor',
      populate: { path: 'user', select: 'name' }
    });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor profile and link to user account
// @route   POST /api/v1/doctors
// @access  Private (Admin only)
exports.createDoctor = async (req, res, next) => {
  try {
    const { name, email, password, phone, specialization, department, qualifications, consultationFee, availability } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    // 1. Check if department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({ success: false, error: 'Department not found' });
    }

    // 2. Create User account first
    const user = await User.create({
      name,
      email,
      password: password || 'doctor123', // fallback default
      role: 'doctor',
      phone
    });

    // 3. Create Doctor profile linked to user
    const doctor = await Doctor.create({
      user: user._id,
      specialization,
      department,
      qualifications,
      consultationFee,
      availability: availability || {
        "Monday": ["09:00-13:00", "14:00-17:00"],
        "Wednesday": ["09:00-13:00", "14:00-17:00"],
        "Friday": ["09:00-13:00", "14:00-17:00"]
      }
    });

    res.status(201).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor
// @route   PATCH /api/v1/doctors/:id
// @access  Private (Admin only)
exports.updateDoctor = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    const { specialization, department, qualifications, consultationFee, availability, phone } = req.body;

    // Update Doctor profile fields
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { specialization, department, qualifications, consultationFee, availability },
      { new: true, runValidators: true }
    );

    // Update linked user details if phone is provided
    if (phone) {
      await User.findByIdAndUpdate(doctor.user, { phone });
    }

    res.status(200).json({
      success: true,
      data: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete doctor
// @route   DELETE /api/v1/doctors/:id
// @access  Private (Admin only)
exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor profile not found' });
    }

    // Delete linked user credentials
    await User.findByIdAndDelete(doctor.user);

    // Delete Doctor profile
    await Doctor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
