import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const { user } = req;
    const userProfile = await User.findById(user.userId).select('-secure_pin');
    res.status(200).json({ success: true, user: userProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { body, user } = req;
    const { name, business_name, phone_number, address, business_type } = body;

    // FIX: Validate critical fields before writing to DB
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { name, business_name, phone_number, address, business_type },
      { new: true, runValidators: true }, // FIX: enforce schema validators on update
    ).select('-secure_pin');

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const setSecurePin = async (req, res) => {
  try {
    const { body, user } = req;
    const { new_pin } = body;

    if (!new_pin || !/^\d{4}$/.test(new_pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const hashedPin = await bcrypt.hash(new_pin, 10);
    await User.findByIdAndUpdate(user.userId, { secure_pin: hashedPin });
    res.status(200).json({ success: true, message: 'Secure PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPin = async (req, res) => {
  try {
    const { body, user } = req;
    const { pin } = body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const userRecord = await User.findById(user.userId);
    if (!userRecord || !userRecord.secure_pin) {
      return res.status(404).json({ success: false, message: 'PIN not set. Please set a PIN first.' });
    }

    const isMatch = await bcrypt.compare(pin, userRecord.secure_pin);
    if (!isMatch) {
      return res.status(403).json({ success: false, message: 'Invalid PIN' });
    }

    res.status(200).json({ success: true, message: 'Access Granted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { user } = req;
    await User.findByIdAndUpdate(user.userId, {
      device_id:  null,
      is_deleted: true,
      deleted_at: new Date(),
    });
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
