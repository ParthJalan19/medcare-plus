const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Bill = require('../models/Bill');

// @desc    Get all prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private (Admin, Doctor, Pharmacist)
exports.getPrescriptions = async (req, res, next) => {
  try {
    const query = {};

    // Pharmacist/Admin can see all. Doctors see what they issued.
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (doctorProfile) {
        query.doctor = doctorProfile._id;
      }
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name DOB contact bloodGroup')
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in patient's prescriptions
// @route   GET /api/v1/prescriptions/my-prescriptions
// @access  Private (Patient role only)
exports.getMyPrescriptions = async (req, res, next) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const prescriptions = await Prescription.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name specialization' }
      })
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue / Create prescription
// @route   POST /api/v1/prescriptions
// @access  Private (Doctor only)
exports.createPrescription = async (req, res, next) => {
  try {
    const { appointment: appointmentId, medicines } = req.body;

    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(403).json({ success: false, error: 'Doctor profile required to issue prescriptions' });
    }

    const appointment = await Appointment.findById(appointmentId).populate('patient');
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Linked appointment not found' });
    }

    // Create prescription document
    const prescription = await Prescription.create({
      appointment: appointmentId,
      doctor: doctorProfile._id,
      patient: appointment.patient._id,
      medicines,
      issuedDate: Date.now()
    });

    // Automatically complete the corresponding appointment
    appointment.status = 'completed';
    await appointment.save();

    // Automatically generate a billing invoice for this appointment
    const fee = doctorProfile.consultationFee || 50;
    const lineItems = [
      { description: `Doctor consultation fee (${doctorProfile.specialization || 'Clinical Specialist'})`, amount: fee }
    ];

    // Add medicines cost estimation
    medicines.forEach(med => {
      lineItems.push({ description: `Prescription fulfill request: ${med.name}`, amount: 15 });
    });

    const totalAmount = lineItems.reduce((acc, curr) => acc + curr.amount, 0);

    await Bill.create({
      patient: appointment.patient._id,
      appointment: appointmentId,
      lineItems,
      totalAmount,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};
