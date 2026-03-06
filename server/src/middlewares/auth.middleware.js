import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

export const protect = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    let token;

    if (authorization?.startsWith('Bearer ')) {
      token = authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role, deviceId } = decoded;
    
    // 2. Fetch User or Staff to check Device ID & Status
    let currentUser;
    let ownerPremiumStatus = false;

    if (role === 'Owner') {
      // Optimize: Only fetch necessary fields
      currentUser = await User.findById(userId).select('name device_id isPremium permissions');
      if (currentUser) ownerPremiumStatus = currentUser.isPremium;
    } else if (role === 'Staff') {
      currentUser = await Staff.findById(userId).select('name device_id permissions owner_id status is_deleted');
      
      if (currentUser) {
        // FIX: Critical Security Check - Block suspended or deleted staff immediately
        if (currentUser.status === 'Suspended' || currentUser.is_deleted) {
          return res.status(403).json({ success: false, message: 'Account suspended or deleted. Contact the owner.' });
        }

        const owner = await User.findById(currentUser.owner_id).select('isPremium');
        ownerPremiumStatus = owner?.isPremium || false;
      }
    }

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // 3. The Single-Device Policy Check
    if (currentUser.device_id !== deviceId) {
      return res.status(401).json({ 
        success: false, 
        message: 'LOGOUT_REQUIRED', 
        reason: 'Account accessed from another device.' 
      });
    }

    // 4. Attach user info to the request object
    req.user = {
      userId: currentUser._id,
      ownerId: role === 'Owner' ? currentUser._id : currentUser.owner_id,
      role,
      name: currentUser.name,
      permissions: currentUser.permissions || null,
      isPremium: ownerPremiumStatus
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please log in again.' });
    }
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};