// Admin session middleware (for admin panel)
module.exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  return res.status(403).json({ message: 'Admin only' });
};

// Moderator session middleware (for moderator panel)
module.exports.requireModerator = (req, res, next) => {
  // Allow admin or moderator
  if (req.session && (req.session.isAdmin || req.session.isModerator)) return next();
  return res.status(403).json({ message: 'Moderator only' });
};
// Authentication middleware for session-based auth
module.exports.isAuthenticated = (req, res, next) => {
  // Allow admin or logged-in user
  if (req.session && (req.session.userId || req.session.isAdmin)) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// Role-based middleware (example usage: isRole('admin'))
module.exports.isRole = (role) => (req, res, next) => {
  if (req.session && req.session.userId && req.user && req.user.role === role) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
};
