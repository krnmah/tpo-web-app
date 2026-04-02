const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

// In-memory store for rate limits
const requestStore = new Map();

// Generate key for store
const generateKey = (identifier, prefix) => `${prefix}:${identifier}`;

// Check and increment rate limit
function checkRateLimit(identifier, prefix, maxRequests, windowMs) {
  const key = generateKey(identifier, prefix);
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing requests
  let requests = requestStore.get(key) || [];

  // Filter out old requests outside the window
  requests = requests.filter(timestamp => timestamp > windowStart);

  // Check if limit exceeded
  if (requests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: requests[0] + windowMs
    };
  }

  // Add current request
  requests.push(now);
  requestStore.set(key, requests);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [storeKey, storeRequests] of requestStore.entries()) {
      const filtered = storeRequests.filter(t => t > Date.now() - windowMs);
      if (filtered.length === 0) {
        requestStore.delete(storeKey);
      } else {
        requestStore.set(storeKey, filtered);
      }
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - requests.length,
    resetAt: now + windowMs
  };
}

/**
 * OTP rate limiter - Max 5 OTP requests per hour per email
 */
function checkOTPRateLimit(email) {
  const result = checkRateLimit(email, 'otp', 5, 60 * 60 * 1000); // 5 per hour
  if (!result.allowed) {
    logger.warn('OTP rate limit exceeded', { email, resetAt: result.resetAt });
    throw new Error('Too many OTP requests. Please try again later.');
  }
  return result;
}

/**
 * Login rate limiter - Max 5 attempts per minute per email
 */
function checkLoginRateLimit(email) {
  const result = checkRateLimit(email, 'login', 5, 60 * 1000); // 5 per minute
  if (!result.allowed) {
    logger.warn('Login rate limit exceeded', { email, resetAt: result.resetAt });
    throw new Error('Too many login attempts. Please try again later.');
  }
  return result;
}

/**
 * Express middleware rate limiter for general routes
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

/**
 * Strict rate limiter for authentication routes
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', { ip: req.ip, route: req.path });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

/**
 * Reset rate limit for a specific identifier (for testing)
 */
function resetRateLimit(identifier, prefix) {
  const key = generateKey(identifier, prefix);
  requestStore.delete(key);
}

/**
 * Clear all rate limits (for testing)
 */
function clearAllRateLimits() {
  requestStore.clear();
}

module.exports = {
  checkOTPRateLimit,
  checkLoginRateLimit,
  generalRateLimiter,
  authRateLimiter,
  resetRateLimit,
  clearAllRateLimits
};
