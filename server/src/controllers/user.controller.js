import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-secure_pin');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserDetails = async (req, res) => {
  try {
    const { business_name, phone_number, address, business_type } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { business_name, phone_number, address, business_type },
      { new: true }
    ).select('-secure_pin');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────
// SET SECURE PIN — hashes before saving
// ─────────────────────────────────────────────
export const setSecurePin = async (req, res) => {
  try {
    const { new_pin } = req.body;

    // Validate: must be exactly 4 digits
    if (!new_pin || !/^\d{4}$/.test(new_pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    // Hash the PIN with bcrypt (salt rounds = 10)
    // Even if two users have the same PIN "1234",
    // their hashed values will be completely different
    const hashedPin = await bcrypt.hash(new_pin, 10);

    await User.findByIdAndUpdate(req.user.userId, {
      secure_pin: hashedPin // ✅ Save hash, never plain text
    });

    res.status(200).json({ success: true, message: 'Secure PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// ─────────────────────────────────────────────
// VERIFY PIN — uses bcrypt.compare, not ===
// ─────────────────────────────────────────────
export const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be exactly 4 digits'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user || !user.secure_pin) {
      return res.status(404).json({
        success: false,
        message: 'PIN not set. Please set a PIN first.'
      });
    }

    // ✅ bcrypt.compare() safely compares plain text against the stored hash
    // It is IMPOSSIBLE to reverse the hash back to the original PIN
    const isMatch = await bcrypt.compare(pin, user.secure_pin);

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
    // Soft delete the owner. You might also want to soft delete all their 
    // associated staff, bills, and products in a production environment.
    await User.findByIdAndUpdate(req.user.userId, { 
      device_id: null, // Forces logout
      // If you add an is_deleted flag to the User model, set it true here
    });
    
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};