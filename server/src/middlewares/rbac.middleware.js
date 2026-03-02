// Example usage in route: checkPermission('bills', 'create')
export const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    // Owners can do everything
    if (req.user.role === 'Owner') {
      return next();
    }

    // For Staff, check their specific permission matrix
    const staffPermissions = req.user.permissions;
    
    if (
      !staffPermissions || 
      !staffPermissions[moduleName] || 
      staffPermissions[moduleName][action] !== true
    ) {
      return res.status(403).json({ 
        success: false, 
        message: `Access Denied: You do not have permission to ${action} ${moduleName}.` 
      });
    }

    next();
  };
};

// Middleware to restrict routes to ONLY the Owner (e.g., viewing profit, deleting staff)
export const ownerOnly = (req, res, next) => {
  if (req.user.role !== 'Owner') {
    return res.status(403).json({ success: false, message: 'Owner access strictly required.' });
  }
  next();
};

export const premiumOnly = (req, res, next) => {
  // We check the isPremium flag that was attached by auth.middleware.js
  if (!req.user || req.user.isPremium !== true) {
    return res.status(403).json({ 
      success: false, 
      message: 'LOCKED: This API requires an active Premium subscription.',
      code: 'PREMIUM_REQUIRED'
    });
  }
  next();
};