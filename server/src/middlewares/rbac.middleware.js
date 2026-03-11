export const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    const { user } = req;

    // Owners can do everything
    if (user.role === 'Owner') {
      return next();
    }

    // For Staff, check their specific permission matrix using optional chaining
    const { permissions } = user;
    
    if (!permissions?.[moduleName]?.[action]) {
      return res.status(403).json({ 
        success: false, 
        message: `Access Denied: You do not have permission to ${action} ${moduleName}.` 
      });
    }

    next();
  };
};

export const ownerOnly = (req, res, next) => {
  const { user } = req;
  if (user.role !== 'Owner') {
    return res.status(403).json({ success: false, message: 'Owner access strictly required.' });
  }
  next();
};

export const premiumOnly = (req, res, next) => {
  const { user } = req;
  
  if (!user?.isPremium) {
    return res.status(403).json({ 
      success: false, 
      message: 'LOCKED: This API requires an active Premium subscription.',
      code: 'PREMIUM_REQUIRED'
    });
  }
  next();
};