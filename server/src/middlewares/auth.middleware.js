import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // 1. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Fetch User or Staff to check Device ID
    let currentUser;
    let ownerPremiumStatus = false; // Added to track actual premium status

    if (decoded.role === 'Owner') {
      currentUser = await User.findById(decoded.userId).select('-secure_pin');
      if (currentUser) ownerPremiumStatus = currentUser.isPremium;
    } else if (decoded.role === 'Staff') {
      currentUser = await Staff.findById(decoded.userId);
      // Fetch the owner to get their actual subscription status
      if (currentUser) {
        const owner = await User.findById(currentUser.owner_id).select('isPremium');
        ownerPremiumStatus = owner ? owner.isPremium : false;
      }
    }

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // 3. The Single-Device Policy Check
    if (currentUser.device_id !== decoded.deviceId) {
      return res.status(401).json({ 
        success: false, 
        message: 'LOGOUT_REQUIRED', 
        reason: 'Account accessed from another device.' 
      });
    }

    // 4. Attach user info to the request object for the controllers to use
    req.user = {
      userId: currentUser._id,
      ownerId: decoded.role === 'Owner' ? currentUser._id : currentUser.owner_id,
      role: decoded.role,
      name: currentUser.name,
      permissions: currentUser.permissions || null,
      isPremium: ownerPremiumStatus // Now accurately reflects the shop's subscription!
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};