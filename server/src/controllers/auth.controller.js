import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT
const generateToken = (userId, role, deviceId) => {
  return jwt.sign({ userId, role, deviceId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const ownerGoogleLogin = async (req, res) => {
  try {
    const { idToken, deviceId } = req.body;
    const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, sub: google_id } = ticket.getPayload();

    let user = await User.findOne({ google_id });
    if (!user) {
      user = await User.create({ google_id, email, name, device_id: deviceId });
    } else {
      // Update device ID to kick out old sessions
      user.device_id = deviceId;
      await user.save();
    }

    const token = generateToken(user._id, 'Owner', deviceId);
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Google Auth Failed', error: error.message });
  }
};

export const requestStaffOtp = async (req, res) => {
  try {
    const { phoneNumber, ownerId } = req.body;
    const staff = await Staff.findOne({ phone_number: phoneNumber, owner_id: ownerId, is_deleted: false });
    
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    staff.assigned_pin = otp; // Temporarily store OTP
    await staff.save();

    // Grab the Socket.io instance attached to the Express app in server.js
    const io = req.app.get('io');
    if (io) {
      // Emit the event to the Owner's specific room
      io.to(ownerId.toString()).emit('staff_otp_request', { 
        staffName: staff.name, 
        otp 
      });
    }

    res.status(200).json({ success: true, message: 'OTP sent to Owner device' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyStaffOtp = async (req, res) => {
  try {
    const { phoneNumber, otp, deviceId } = req.body;
    const staff = await Staff.findOne({ phone_number: phoneNumber, assigned_pin: otp });

    if (!staff) return res.status(401).json({ success: false, message: 'Invalid OTP or Phone Number' });
     if (staff.status === 'Suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been suspended. Please contact the shop owner.' 
      });
    }

    staff.device_id = deviceId;
    // staff.assigned_pin = ''; // Clear OTP after use
    await staff.save();

    const token = generateToken(staff._id, 'Staff', deviceId);
    res.status(200).json({ success: true, token, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Client deletes token locally. Server clears device_id to force logout.
    if (req.user.role === 'Owner') {
      await User.findByIdAndUpdate(req.user.userId, { device_id: null });
    } else {
      await Staff.findByIdAndUpdate(req.user.userId, { device_id: null });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};