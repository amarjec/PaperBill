import Staff from '../models/Staff.js';

export const addStaff = async (req, res) => {
  try {
    const { name, phone_number, assigned_pin, permissions } = req.body;
    const owner_id = req.user.userId; // Must be Owner

    const staffExists = await Staff.findOne({ owner_id, phone_number });
    if (staffExists) {
      return res.status(400).json({ success: false, message: 'Staff with this number already exists.' });
    }

    const staff = await Staff.create({
      owner_id,
      name,
      phone_number,
      assigned_pin,
      permissions
    });

    res.status(201).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStaffMembers = async (req, res) => {
  try {
    const staff = await Staff.find({ owner_id: req.user.userId, is_deleted: false }).select('-assigned_pin');
    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStaffPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, status, assigned_pin } = req.body;

    const staff = await Staff.findOneAndUpdate(
      { _id: id, owner_id: req.user.userId },
      { permissions, status, assigned_pin },
      { new: true }
    ).select('-assigned_pin');

    res.status(200).json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await Staff.findOneAndUpdate(
      { _id: id, owner_id: req.user.userId },
      { 
        is_deleted: true, 
        deleted_by: req.user.name, 
        deleted_at: new Date(),
        device_id: null // Force logout immediately
      }
    );
    res.status(200).json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};