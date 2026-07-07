const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Department = require('./models/Department');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Medicine = require('./models/Medicine');
const PharmacyInventory = require('./models/PharmacyInventory');
const Bill = require('./models/Bill');
const LabTest = require('./models/LabTest');
const MedicalRecord = require('./models/MedicalRecord');
const Prescription = require('./models/Prescription');
const Payment = require('./models/Payment');

const seedDB = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database. Cleaning up existing collections...');

    // Clear all existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Medicine.deleteMany({});
    await PharmacyInventory.deleteMany({});
    await Bill.deleteMany({});
    await LabTest.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Prescription.deleteMany({});

    console.log('Collections cleared.');

    // 1. Create Departments
    const cardiology = await Department.create({
      name: 'Cardiology',
      description: 'Department focused on heart disorders, cardiovascular surgeries, and clinical checkups.'
    });

    const pediatrics = await Department.create({
      name: 'Pediatrics',
      description: 'Medical care for infants, children, and adolescents.'
    });

    const pharmacyDept = await Department.create({
      name: 'Pharmacy',
      description: 'Hospital outpatient and inpatient pharmaceutical services.'
    });

    console.log('Departments created.');

    // 2. Create Users for all 7 Roles
    const password = 'password123'; // will be hashed automatically by User pre-save hook

    const adminUser = await User.create({
      name: 'Dr. Arthur Pendragon',
      email: 'admin@medcareplus.com',
      password,
      role: 'admin',
      phone: '123-456-7890'
    });

    const doctorUser = await User.create({
      name: 'Dr. Gregory House',
      email: 'doctor@medcareplus.com',
      password,
      role: 'doctor',
      phone: '123-456-7891'
    });

    const receptionistUser = await User.create({
      name: 'Pam Beesly',
      email: 'receptionist@medcareplus.com',
      password,
      role: 'receptionist',
      phone: '123-456-7892'
    });

    const nurseUser = await User.create({
      name: 'Florence Nightingale',
      email: 'nurse@medcareplus.com',
      password,
      role: 'nurse',
      phone: '123-456-7893'
    });

    const labUser = await User.create({
      name: 'Barry Allen',
      email: 'lab@medcareplus.com',
      password,
      role: 'lab',
      phone: '123-456-7894'
    });

    const pharmacistUser = await User.create({
      name: 'Walter White',
      email: 'pharmacist@medcareplus.com',
      password,
      role: 'pharmacist',
      phone: '123-456-7895'
    });

    const patientUser = await User.create({
      name: 'John Doe',
      email: 'patient@medcareplus.com',
      password,
      role: 'patient',
      phone: '123-456-7896'
    });

    console.log('Users created.');

    // 3. Create Doctor Profile (Gregory House)
    const doctorProfile = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Diagnostic Medicine & Cardiology',
      department: cardiology._id,
      qualifications: 'MD from Johns Hopkins University',
      consultationFee: 150,
      availability: {
        "Monday": ["09:00-12:00", "14:00-17:00"],
        "Wednesday": ["09:00-12:00", "14:00-17:00"],
        "Friday": ["09:00-12:00", "14:00-17:00"]
      }
    });

    // Update Cardiology head doctor
    cardiology.headDoctor = doctorProfile._id;
    await cardiology.save();

    console.log('Doctor profile configured.');

    // 4. Create Patients (John Doe - linked, plus 3 standalone patients)
    const linkedPatient = await Patient.create({
      user: patientUser._id,
      name: 'John Doe',
      DOB: new Date('1985-05-15'),
      gender: 'male',
      bloodGroup: 'O+',
      contact: '123-456-7896',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContact: 'Jane Doe (Wife) - 987-654-3210',
      allergies: ['Penicillin', 'Peanuts']
    });

    const standalonePatient1 = await Patient.create({
      name: 'Alice Smith',
      DOB: new Date('1992-09-20'),
      gender: 'female',
      bloodGroup: 'A-',
      contact: '555-019-2834',
      address: '12 Bluebell Lane, Boston',
      emergencyContact: 'Bob Smith (Father) - 555-019-2835',
      allergies: ['Sulfa drugs']
    });

    const standalonePatient2 = await Patient.create({
      name: 'Tommy Shelby',
      DOB: new Date('1978-11-01'),
      gender: 'male',
      bloodGroup: 'AB+',
      contact: '555-021-9382',
      address: 'Watery Lane, Birmingham',
      emergencyContact: 'Ada Shelby (Sister) - 555-021-9383',
      allergies: []
    });

    const standalonePatient3 = await Patient.create({
      name: 'Bruce Wayne',
      DOB: new Date('1980-02-19'),
      gender: 'male',
      bloodGroup: 'O-',
      contact: '555-999-8888',
      address: 'Wayne Manor, Gotham City',
      emergencyContact: 'Alfred Pennyworth (Butler) - 555-999-7777',
      allergies: ['Bats']
    });

    console.log('Patient profiles configured.');

    // 5. Create Appointments
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appt1 = await Appointment.create({
      patient: linkedPatient._id,
      doctor: doctorProfile._id,
      department: cardiology._id,
      date: yesterday,
      timeSlot: '09:00-09:30',
      status: 'completed',
      reason: 'Routine ECG review after chest pains last month.',
      notes: 'Patient exhibits normal sinus rhythm. Advised lower sodium intake.'
    });

    const appt2 = await Appointment.create({
      patient: standalonePatient1._id,
      doctor: doctorProfile._id,
      department: cardiology._id,
      date: today,
      timeSlot: '10:00-10:30',
      status: 'confirmed',
      reason: 'Chronic hypertension follow-up.',
      notes: 'Review blood pressure log.'
    });

    const appt3 = await Appointment.create({
      patient: standalonePatient2._id,
      doctor: doctorProfile._id,
      department: cardiology._id,
      date: tomorrow,
      timeSlot: '11:00-11:30',
      status: 'pending',
      reason: 'New patient consultation for arrhythmia.',
      notes: ''
    });

    console.log('Appointments configured.');

    // 6. Create Medical Records & Prescriptions for the Completed Appointment
    const medRecord = await MedicalRecord.create({
      patient: linkedPatient._id,
      doctor: doctorProfile._id,
      diagnosis: 'Mild hypertension & general anxiety',
      treatment: 'Start beta blockers and recommend breathing exercises twice daily.',
      visitDate: yesterday,
      attachments: []
    });

    const prescription = await Prescription.create({
      appointment: appt1._id,
      doctor: doctorProfile._id,
      patient: linkedPatient._id,
      medicines: [
        {
          name: 'Metoprolol Succinate',
          dosage: '25mg',
          duration: '30 days',
          instructions: 'Take 1 tablet daily in the morning with food.'
        },
        {
          name: 'Alprazolam',
          dosage: '0.25mg',
          duration: '10 days',
          instructions: 'Take 1 tablet at night only if feeling highly anxious.'
        }
      ],
      issuedDate: yesterday
    });

    console.log('Medical records & prescriptions seeded.');

    // 7. Create Pharmacy Medicines & Stock Inventory
    const med1 = await Medicine.create({
      name: 'Metoprolol Succinate',
      category: 'Beta-Blocker / Antihypertensive',
      unit: 'tablet',
      reorderThreshold: 100
    });

    const med2 = await Medicine.create({
      name: 'Alprazolam',
      category: 'Anxiolytic / Benzodiazepine',
      unit: 'tablet',
      reorderThreshold: 50
    });

    const med3 = await Medicine.create({
      name: 'Amoxicillin Trihydrate',
      category: 'Antibiotic',
      unit: 'capsule',
      reorderThreshold: 80
    });

    const med4 = await Medicine.create({
      name: 'Paracetamol',
      category: 'Analgesic / Antipyretic',
      unit: 'tablet',
      reorderThreshold: 20 // Let's set low stock alert trigger!
    });

    console.log('Medicines database created.');

    // Seeding Pharmacy Inventory
    await PharmacyInventory.create({
      medicine: med1._id,
      batchNumber: 'MET-2026-A1',
      quantity: 500,
      expiryDate: new Date('2028-12-31'),
      supplier: 'PharmaCorp Global'
    });

    await PharmacyInventory.create({
      medicine: med2._id,
      batchNumber: 'ALP-2026-X9',
      quantity: 120,
      expiryDate: new Date('2027-06-30'),
      supplier: 'Apex Distribution'
    });

    // Seed low stock item for medicine 4
    await PharmacyInventory.create({
      medicine: med4._id,
      batchNumber: 'PAR-2026-Z3',
      quantity: 12, // lower than reorderThreshold (20)
      expiryDate: new Date('2027-01-15'),
      supplier: 'Local Generics Co.'
    });

    console.log('Pharmacy Inventory seeded.');

    // 8. Seeding Bills & Payments
    const bill1 = await Bill.create({
      patient: linkedPatient._id,
      appointment: appt1._id,
      lineItems: [
        { description: 'Cardiology Consultation Fee', amount: 150 },
        { description: 'ECG Screening & Analysis', amount: 120 },
        { description: 'Prescription Fulfillments (Beta-blockers)', amount: 45 }
      ],
      totalAmount: 315,
      status: 'paid'
    });

    await Bill.create({
      patient: standalonePatient1._id,
      appointment: appt2._id,
      lineItems: [
        { description: 'Cardiology Follow-up consultation', amount: 100 }
      ],
      totalAmount: 100,
      status: 'pending'
    });

    // Create payment entry for paid bill
    await Bill.findOneAndUpdate({ _id: bill1._id }, { status: 'paid' });
    await Payment.create({
      bill: bill1._id,
      amount: 315,
      method: 'card',
      transactionDate: yesterday
    });

    // 9. Seeding Lab Tests
    await LabTest.create({
      patient: linkedPatient._id,
      doctor: doctorProfile._id,
      testType: 'Complete Blood Count (CBC)',
      status: 'completed',
      resultFile: 'uploads/cbc_report_sample.pdf',
      orderedDate: yesterday,
      completedDate: yesterday
    });

    await LabTest.create({
      patient: standalonePatient1._id,
      doctor: doctorProfile._id,
      testType: 'Lipid Profile',
      status: 'ordered',
      orderedDate: today
    });

    console.log('Bills, payments, and lab tests seeded successfully.');
    console.log('Database Seeding Completed Successfully! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error.message);
    process.exit(1);
  }
};

seedDB();
