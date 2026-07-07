const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Get all bills
// @route   GET /api/v1/billing
// @access  Private (Admin, Receptionist)
exports.getBills = async (req, res, next) => {
  try {
    const bills = await Bill.find()
      .populate('patient', 'name DOB contact')
      .populate('appointment', 'date timeSlot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's own bills
// @route   GET /api/v1/billing/my-bills
// @access  Private (Patient role only)
exports.getMyBills = async (req, res, next) => {
  try {
    const patientProfile = await Patient.findOne({ user: req.user.id });
    if (!patientProfile) {
      return res.status(404).json({ success: false, error: 'Patient profile not found' });
    }

    const bills = await Bill.find({ patient: patientProfile._id })
      .populate('appointment', 'date timeSlot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create manual bill
// @route   POST /api/v1/billing
// @access  Private (Admin, Receptionist)
exports.createBill = async (req, res, next) => {
  try {
    const { patient: patientId, appointment: appointmentId, lineItems } = req.body;

    const totalAmount = lineItems.reduce((acc, curr) => acc + curr.amount, 0);

    const bill = await Bill.create({
      patient: patientId,
      appointment: appointmentId || null,
      lineItems,
      totalAmount,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record bill payment
// @route   POST /api/v1/billing/:id/pay
// @access  Private (Admin, Receptionist, Patient)
exports.payBill = async (req, res, next) => {
  try {
    const { amount, method } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({ success: false, error: 'This invoice has already been paid' });
    }

    // Create payment record
    const payment = await Payment.create({
      bill: bill._id,
      amount,
      method,
      transactionDate: Date.now()
    });

    // Update bill status to paid
    bill.status = 'paid';
    await bill.save();

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF Receipt Invoice
// @route   GET /api/v1/billing/:id/pdf
// @access  Private (Token passed in query string for browser download convenience)
exports.getInvoicePDF = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(401).send('Unauthorized: Token missing');
    }

    // Verify token since query params are used instead of auth headers for direct tab downloads
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).send('Unauthorized: Token invalid or expired');
    }

    const activeUser = await User.findById(decoded.id);
    if (!activeUser) {
      return res.status(401).send('Unauthorized: User not found');
    }

    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'name DOB contact address')
      .populate('appointment', 'date timeSlot');

    if (!bill) {
      return res.status(404).send('Invoice statement not found');
    }

    // Authorize patient check (patients can only download their own bills)
    if (activeUser.role === 'patient') {
      const patientProfile = await Patient.findOne({ user: activeUser.id });
      if (!patientProfile || bill.patient._id.toString() !== patientProfile._id.toString()) {
        return res.status(403).send('Forbidden: Access to this receipt is restricted');
      }
    }

    // Initialize PDFKit document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${bill._id}.pdf"`);

    // Stream PDF directly to client response
    doc.pipe(res);

    // PDF styling & structure
    doc
      .fillColor('#0F6E56')
      .fontSize(20)
      .text('MEDCARE PLUS CLINIC', 50, 50)
      .fontSize(10)
      .fillColor('#475569')
      .text('Smart Healthcare Management Ecosystem', 50, 75)
      .text('742 Evergreen Terrace, Springfield', 50, 90)
      .text('Phone: 123-456-7890 | support@medcareplus.com', 50, 105);

    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, 125)
      .lineTo(550, 125)
      .stroke();

    doc
      .fillColor('#0f172a')
      .fontSize(14)
      .text('OFFICIAL INVOICE RECEIPT', 50, 145)
      .fontSize(10)
      .fillColor('#475569')
      .text(`Invoice Ref: #${bill._id.toString().toUpperCase()}`, 50, 165)
      .text(`Date of Issue: ${new Date(bill.createdAt).toLocaleDateString()}`, 50, 180)
      .text(`Payment Status: ${bill.status.toUpperCase()}`, 50, 195);

    // Patient Info Section
    doc
      .fillColor('#0f172a')
      .fontSize(11)
      .text('PATIENT BILLING DETAILS', 350, 145)
      .fontSize(10)
      .fillColor('#475569')
      .text(`Name: ${bill.patient.name}`, 350, 165)
      .text(`Date of Birth: ${new Date(bill.patient.DOB).toLocaleDateString()}`, 350, 180)
      .text(`Contact: ${bill.patient.contact}`, 350, 195)
      .text(`Address: ${bill.patient.address || 'N/A'}`, 350, 210);

    doc
      .strokeColor('#e2e8f0')
      .moveTo(50, 235)
      .lineTo(550, 235)
      .stroke();

    // Table Header
    doc
      .fillColor('#0F6E56')
      .fontSize(10)
      .text('Line Item Description', 50, 255)
      .text('Cost Charge', 480, 255, { width: 70, align: 'right' });

    doc
      .strokeColor('#cbd5e1')
      .moveTo(50, 270)
      .lineTo(550, 270)
      .stroke();

    // Table Body
    let yPos = 285;
    bill.lineItems.forEach(item => {
      doc
        .fillColor('#0f172a')
        .text(item.description, 50, yPos)
        .text(`$${item.amount.toFixed(2)}`, 480, yPos, { width: 70, align: 'right' });
      yPos += 20;
    });

    doc
      .strokeColor('#cbd5e1')
      .moveTo(50, yPos + 5)
      .lineTo(550, yPos + 5)
      .stroke();

    // Total Charge
    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .text('Grand Total:', 350, yPos + 20)
      .text(`$${bill.totalAmount.toFixed(2)}`, 480, yPos + 20, { width: 70, align: 'right' });

    // Footer signature notice
    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .text('This is a computer generated invoice statement and requires no physical signature.', 50, 700, { align: 'center' })
      .text('MedCare Plus Hospital Management System. Sentence Case UI Policy enforced.', 50, 715, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', error.message);
    res.status(500).send('Failed to compile receipt PDF.');
  }
};
