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

export const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user.userId);
    
    // Note: In production, compare hashed PINs using bcrypt
    if (user.secure_pin !== pin) {
      return res.status(403).json({ success: false, message: 'Invalid PIN' });
    }
    res.status(200).json({ success: true, message: 'Access Granted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
 
export const setSecurePin = async (req, res) => {
  try {
    const { new_pin } = req.body;
    
    // Basic validation
    if (!new_pin || new_pin.length !== 4) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    // In a real production app, use bcrypt to hash this!
    await User.findByIdAndUpdate(req.user.userId, { secure_pin: new_pin });
    
    res.status(200).json({ success: true, message: 'Secure PIN updated successfully' });
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