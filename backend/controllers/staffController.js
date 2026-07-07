const User = require('../models/User');

// @desc    Get all staff members (non-patients)
// @route   GET /api/v1/staff
// @access  Private (Admin only)
exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $ne: 'patient' } })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new staff user
// @route   POST /api/v1/staff
// @access  Private (Admin only)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle staff active/deactivated status
// @route   PATCH /api/v1/staff/:id/toggle-active
// @access  Private (Admin only)
exports.toggleStaffActive = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Staff member account not found' });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own administrative account' });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
