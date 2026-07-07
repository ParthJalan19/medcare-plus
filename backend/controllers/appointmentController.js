const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Department = require('../models/Department');
const User = require('../models/User');
const { sendEmail } = require('../config/email');

// Helper to check if a doctor is available on a specific weekday
const isDoctorOnDuty = (doctor, dateStr) => {
  const dateObj = new Date(dateStr);
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = weekdays[dateObj.getDay()];
  
  // If doctor.availability is a Map
  if (doctor.availability && typeof doctor.availability.get === 'function') {
    const slots = doctor.availability.get(dayName);
    return slots && slots.length > 0;
  }
  
  // If doctor.availability is a plain object
  if (doctor.availability && doctor.availability[dayName]) {
    return doctor.availability[dayName].length > 0;
  }

  return false;
};

// @desc    Get all appointments
// @route   GET /api/v1/appointments
// @access  Private (Admin, Doctor, Receptionist, Nurse)
exports.getAppointments = async (req, res, next) => {
  try {
    const { doctor, patient, date, status } = req.query;
    const query = {};

    if (doctor) query.doctor = doctor;
    if (patient) query.patient = patient;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (status) query.status = status;

    // If active user is a Doctor, restrict to their own appointments
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ user: req.user.id });
      if (doctorProfile) {
        query.doctor = doctorProfile._id;
      }
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        select: 'name contact DOB gender'
      })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('department', 'name')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in patient's own appointments
// @route   GET /api/v1/appointments/my-appointments
// @access  Private (Patient role only)
exports.getMyAppointments = async (req, res, next) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: 'Patient profile not found for this account' });
    }

    const appointments = await Appointment.find({ patient: patientProfile._id })
      .populate({
        path: 'doctor',
        populate: { path: 'user', select: 'name specialization' }
      })
      .populate('department', 'name')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/v1/appointments/available-slots
// @access  Private
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctor: doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, error: 'Please provide doctor ID and date' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Standard daily slots list
    const standardSlots = [
      '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00',
      '11:00-11:30', '11:30-12:00', '14:00-14:30', '14:30-15:00',
      '15:00-15:30', '15:30-16:00'
    ];

    // Check if doctor is on duty that weekday
    const onDuty = isDoctorOnDuty(doctor, date);
    if (!onDuty) {
      return res.status(200).json({
        success: true,
        data: standardSlots.map(slot => ({ slot, available: false, reason: 'Doctor off duty on this day' }))
      });
    }

    // Find already booked slots on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppts = await Appointment.find({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    const bookedSlots = bookedAppts.map(appt => appt.timeSlot);

    const slotsAvailability = standardSlots.map(slot => {
      const isBooked = bookedSlots.includes(slot);
      return {
        slot,
        available: !isBooked,
        reason: isBooked ? 'Slot already booked' : 'Available'
      };
    });

    res.status(200).json({
      success: true,
      data: slotsAvailability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book / Schedule appointment
// @route   POST /api/v1/appointments
// @access  Private (Patient, Admin, Receptionist, Doctor)
exports.createAppointment = async (req, res, next) => {
  try {
    const { patient: patientId, doctor: doctorId, department: departmentId, date, timeSlot, reason, notes } = req.body;

    // 1. Verify doctor exists and has availability
    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Attending physician not found' });
    }

    // 2. Verify doctor is on duty
    if (!isDoctorOnDuty(doctor, date)) {
      return res.status(400).json({ success: false, error: 'Doctor is off duty on this day of the week' });
    }

    // 3. Verify slot is not already booked
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const slotTaken = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (slotTaken) {
      return res.status(400).json({ success: false, error: 'Selected time slot is already booked' });
    }

    // 4. Verify patient exists
    const patient = await Patient.findById(patientId).populate('user', 'email name');
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    // 5. Default status: patient self-booking is 'pending', staff scheduling is 'confirmed'
    const status = req.user.role === 'patient' ? 'pending' : 'confirmed';

    // 6. Create appointment
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      department: departmentId,
      date,
      timeSlot,
      status,
      reason,
      notes
    });

    // 7. Send confirmation email to patient
    let patientEmail = patient.user?.email;
    if (!patientEmail && req.user.role === 'patient') {
      patientEmail = req.user.email;
    }

    if (patientEmail) {
      const emailSubject = `MedCare Plus — Appointment ${status === 'confirmed' ? 'Confirmed' : 'Received'}`;
      const emailBody = `
        <h3>Dear ${patient.name},</h3>
        <p>Your appointment booking has been registered.</p>
        <ul>
          <li><strong>Doctor:</strong> ${doctor.user?.name}</li>
          <li><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</li>
          <li><strong>Time Slot:</strong> ${timeSlot}</li>
          <li><strong>Status:</strong> ${status}</li>
        </ul>
        <p>Thank you for choosing MedCare Plus.</p>
      `;

      await sendEmail({
        to: patientEmail,
        subject: emailSubject,
        html: emailBody
      });
    }

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/v1/appointments/:id/status
// @access  Private (Admin, Doctor, Receptionist, Nurse)
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid appointment status' });
    }

    let appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'email' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    // Send status update email notification
    const patientEmail = appointment.patient?.user?.email || appointment.patient?.contact;
    if (patientEmail && patientEmail.includes('@')) {
      const emailSubject = `MedCare Plus — Appointment status updated to ${status}`;
      const emailBody = `
        <h3>Dear ${appointment.patient.name},</h3>
        <p>The status of your scheduled checkup has been updated to <strong>${status}</strong>.</p>
        <ul>
          <li><strong>Doctor:</strong> ${appointment.doctor.user?.name}</li>
          <li><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${appointment.timeSlot}</li>
        </ul>
      `;
      await sendEmail({
        to: patientEmail,
        subject: emailSubject,
        html: emailBody
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
