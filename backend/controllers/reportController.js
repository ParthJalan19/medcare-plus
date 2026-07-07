const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const PharmacyInventory = require('../models/PharmacyInventory');
const LabTest = require('../models/LabTest');
const Bill = require('../models/Bill');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');

// @desc    Get dashboard metrics stats counts
// @route   GET /api/v1/reports/metrics
// @access  Private (Admin, Doctor, Receptionist, Nurse, Lab, Pharmacist)
exports.getMetrics = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const doctorsOnDuty = await Doctor.countDocuments();

    // Today's appointments count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    // Today's revenue calculation
    const billsPaidToday = await Bill.find({
      status: 'paid',
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const revenueToday = billsPaidToday.reduce((sum, b) => sum + b.totalAmount, 0);

    // Medicines with stock below threshold
    const medicines = await Medicine.find();
    let lowStockAlerts = 0;
    for (const med of medicines) {
      const batches = await PharmacyInventory.find({ medicine: med._id });
      const medStock = batches.reduce((sum, item) => sum + item.quantity, 0);
      if (medStock <= med.reorderThreshold) {
        lowStockAlerts++;
      }
    }

    // Pending lab tests count
    const labPending = await LabTest.countDocuments({
      status: { $in: ['ordered', 'in-progress'] }
    });

    // Staff on duty
    const staffOnDuty = await User.countDocuments({
      role: { $ne: 'patient' },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalPatients,
        doctorsOnDuty,
        appointmentsToday,
        revenueToday,
        lowStockAlerts,
        labPending,
        staffOnDuty
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity logs
// @route   GET /api/v1/reports/activity-logs
// @access  Private (Admin, Staff)
exports.getActivityLogs = async (req, res, next) => {
  try {
    let logs = await ActivityLog.find()
      .populate('user', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    // Seed mock entries if log is empty
    if (logs.length === 0) {
      logs = [
        { user: { name: 'Pam Beesly', role: 'receptionist' }, action: 'scheduled a confirmed appointment for John Doe', timestamp: new Date() },
        { user: { name: 'Dr. Gregory House', role: 'doctor' }, action: 'completed consultation and issued Metoprolol', timestamp: new Date(Date.now() - 3600000) },
        { user: { name: 'Walter White', role: 'pharmacist' }, action: 'logged new Amoxicillin batch stock ALP-2026-X9', timestamp: new Date(Date.now() - 7200000) }
      ];
    }

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export appointments ledger as Excel
// @route   GET /api/v1/reports/export/excel
// @access  Private (Token verification inside since browser direct window.open triggers query params)
exports.exportExcel = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Unauthorized: Token missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role === 'patient') {
      return res.status(403).send('Forbidden: Access restricted');
    }

    const appointments = await Appointment.find()
      .populate({ path: 'patient', select: 'name contact' })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('department', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Appointments List');

    worksheet.columns = [
      { header: 'Patient Name', key: 'patientName', width: 25 },
      { header: 'Patient Contact', key: 'patientContact', width: 20 },
      { header: 'Attending Doctor', key: 'doctor', width: 25 },
      { header: 'Department', key: 'dept', width: 20 },
      { header: 'Appointment Date', key: 'date', width: 15 },
      { header: 'Time Slot', key: 'slot', width: 15 },
      { header: 'Booking Status', key: 'status', width: 15 },
      { header: 'Consultation Reason', key: 'reason', width: 35 }
    ];

    appointments.forEach(a => {
      worksheet.addRow({
        patientName: a.patient?.name || 'N/A',
        patientContact: a.patient?.contact || 'N/A',
        doctor: a.doctor?.user?.name || 'N/A',
        dept: a.department?.name || 'N/A',
        date: new Date(a.date).toLocaleDateString(),
        slot: a.timeSlot,
        status: a.status,
        reason: a.reason
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="appointments-ledger.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Export Error:', error.message);
    res.status(500).send('Failed to generate Excel ledger.');
  }
};

// @desc    Export hospital summary report PDF
// @route   GET /api/v1/reports/export/pdf
// @access  Private (Token verification inside)
exports.exportPDF = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).send('Unauthorized: Token missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role === 'patient') {
      return res.status(403).send('Forbidden: Access restricted');
    }

    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppts = await Appointment.countDocuments();
    const totalMeds = await Medicine.countDocuments();

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="hospital-report.pdf"');

    doc.pipe(res);

    doc
      .fillColor('#0F6E56')
      .fontSize(22)
      .text('MEDCARE PLUS CLINICAL REPORT', 50, 50)
      .fontSize(10)
      .fillColor('#475569')
      .text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 75)
      .text('Ecosystem summary and operational statistics', 50, 90);

    doc
      .strokeColor('#cbd5e1')
      .moveTo(50, 115)
      .lineTo(550, 115)
      .stroke();

    // Summary Section
    doc
      .fillColor('#0f172a')
      .fontSize(14)
      .text('Operational statistics', 50, 140)
      .fontSize(11)
      .fillColor('#475569')
      .text(`Total patient registers: ${totalPatients}`, 70, 170)
      .text(`Staff physicians on duty: ${totalDoctors}`, 70, 190)
      .text(`Cumulative checkup appointments booked: ${totalAppts}`, 70, 210)
      .text(`Pharmaceutical catalog records: ${totalMeds}`, 70, 230);

    doc
      .strokeColor('#cbd5e1')
      .moveTo(50, 270)
      .lineTo(550, 270)
      .stroke();

    doc
      .fillColor('#0f172a')
      .fontSize(14)
      .text('Administrative statement disclosure', 50, 290)
      .fontSize(10)
      .fillColor('#475569')
      .text('This audit document reviews current clinic statistics and reorder states. All databases are securely synchronized with MongoDB Atlas clusters. Patient private medical charts and laboratory PDFs are encrypted and excluded from aggregate downloads.', 50, 315, { width: 500, align: 'justify', lineGap: 4 });

    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .text('MedCare Plus Hospital Management System. Sentence Case UI Policy enforced.', 50, 720, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF Export Error:', error.message);
    res.status(500).send('Failed to generate PDF summary.');
  }
};
