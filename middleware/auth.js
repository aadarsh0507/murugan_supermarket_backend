import jwt from 'jsonwebtoken';
import {
  getUserById
} from '../repositories/userRepository.js';

const parseCookieHeader = (cookieHeader = '') => {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split('=');
      if (!key) return acc;
      acc[key] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
};

const getTokenFromRequest = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  if (req.headers.cookie) {
    const cookies = parseCookieHeader(req.headers.cookie);
    if (cookies.token) {
      return cookies.token;
    }
  }

  return null;
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);

    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is valid but user no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User account is deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token.'
    });
  }
};

export const protect = authenticate;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (token) {
      const decoded = verifyToken(token);
      const user = await getUserById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
