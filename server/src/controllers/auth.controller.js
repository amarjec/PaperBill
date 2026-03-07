import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, role, deviceId) => {
  return jwt.sign({ userId, role, deviceId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const ownerGoogleLogin = async (req, res) => {
  try {
    const { body } = req;
    const { idToken, deviceId } = body;
    
    if (!idToken || !deviceId) {
      return res.status(400).json({ success: false, message: 'idToken and deviceId are required' });
    }

    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, sub: google_id } = ticket.getPayload();

    let user = await User.findOne({ google_id });
    if (!user) {
      user = await User.create({ google_id, email, name, device_id: deviceId });
    } else {
      user.device_id = deviceId;
      await user.save();
    }

    const token = generateToken(user._id, 'Owner', deviceId);
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Google Auth Failed', error: error.message });
  }
};

export const verifyStaffOtp = async (req, res) => {
  try {
    const { body } = req;
    const { phoneNumber, otp, deviceId } = body;
    
    if (!phoneNumber || !otp || !deviceId) {
      return res.status(400).json({ success: false, message: 'Phone number, OTP, and deviceId are required' });
    }

    // 👇 1. UPDATE THIS LINE TO POPULATE THE OWNER's PREMIUM DATA
    const staff = await Staff.findOne({ phone_number: phoneNumber })
      .populate('owner_id', 'isPremium subscription');

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid phone number' });
    }
    if (staff.is_deleted) {
      return res.status(403).json({ success: false, message: 'Account no longer exists.' });
    }
    if (staff.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact the owner.' });
    }

    const bcrypt = await import('bcryptjs');
    const isPinValid = await bcrypt.default.compare(otp, staff.assigned_pin || '');
    if (!isPinValid) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    staff.device_id   = deviceId;
    staff.assigned_pin = ''; // Invalidate one-time PIN after use
    await staff.save();

    const token = generateToken(staff._id, 'Staff', deviceId);
    res.status(200).json({ success: true, token, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { user } = req;
    const Model = user.role === 'Owner' ? User : Staff;
    await Model.findByIdAndUpdate(user.userId, { device_id: null });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};