const Medicine = require('../models/Medicine');
const PharmacyInventory = require('../models/PharmacyInventory');
const User = require('../models/User');
const { sendEmail } = require('../config/email');

// @desc    Get all medicines catalogued
// @route   GET /api/v1/pharmacy/medicines
// @access  Private (Admin, Doctor, Pharmacist)
exports.getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add medicine definition
// @route   POST /api/v1/pharmacy/medicines
// @access  Private (Admin, Pharmacist)
exports.createMedicine = async (req, res, next) => {
  try {
    const { name, category, unit, reorderThreshold } = req.body;

    const exists = await Medicine.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Medicine name already exists in catalog' });
    }

    const medicine = await Medicine.create({
      name,
      category,
      unit,
      reorderThreshold
    });

    res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory batches
// @route   GET /api/v1/pharmacy/inventory
// @access  Private (Admin, Pharmacist)
exports.getInventory = async (req, res, next) => {
  try {
    const inventory = await PharmacyInventory.find()
      .populate('medicine')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add batch stock & check reorder levels
// @route   POST /api/v1/pharmacy/inventory
// @access  Private (Admin, Pharmacist)
exports.createInventoryBatch = async (req, res, next) => {
  try {
    const { medicine: medicineId, batchNumber, quantity, expiryDate, supplier } = req.body;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, error: 'Medicine catalog record not found' });
    }

    const batch = await PharmacyInventory.create({
      medicine: medicineId,
      batchNumber,
      quantity,
      expiryDate,
      supplier
    });

    // Check if total stock is below reorder threshold
    const allBatches = await PharmacyInventory.find({ medicine: medicineId });
    const totalQty = allBatches.reduce((sum, item) => sum + item.quantity, 0);

    if (totalQty <= (medicine.reorderThreshold || 10)) {
      console.warn(`LOW STOCK WARNING: ${medicine.name} total stock is ${totalQty}. Threshold is ${medicine.reorderThreshold}.`);
      
      // Notify Pharmacist
      const pharmacists = await User.find({ role: 'pharmacist', isActive: true });
      const emails = pharmacists.map(p => p.email).filter(Boolean);
      
      if (emails.length > 0) {
        await sendEmail({
          to: emails.join(','),
          subject: `Low Stock Alert: ${medicine.name}`,
          html: `
            <h3>Low Stock Warning</h3>
            <p>The pharmaceutical inventory has flagged a low stock state.</p>
            <ul>
              <li><strong>Medicine:</strong> ${medicine.name}</li>
              <li><strong>Total Quantity:</strong> ${totalQty} ${medicine.unit}s</li>
              <li><strong>Reorder Threshold:</strong> ${medicine.reorderThreshold}</li>
            </ul>
            <p>Please restock this item soon.</p>
          `
        });
      }
    }

    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
};
