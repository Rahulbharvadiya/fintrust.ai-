// Multi-Tier Role-Based Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

/**
 * Extracts and verifies Bearer JWT token from Authorization header or cookie
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: Bearer JWT token missing in Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, full_name, affiliation }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session Expired: Your authentication token has expired. Please re-authenticate.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid Token: Signature verification failed or malformed token.'
    });
  }
}

/**
 * Optional token: Populates req.user if a valid token is present, else proceeds as guest
 */
function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // Proceed without user
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param {string[]} allowedRoles Array of acceptable roles (e.g. ['ORGANIZER', 'JUDGE'])
 */
function requireRole(allowedRoles = []) {
  const rolesUpper = allowedRoles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication is required to access this resource.'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!rolesUpper.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access requires role [${rolesUpper.join(', ')}]. Current role: '${userRole}'.`
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  optionalToken,
  requireRole
};
