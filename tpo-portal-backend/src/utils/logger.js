const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'tnp-portal' },
  transports: [
    // Write all logs with importance level of 'error' or less to error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Logging helpers
const logAuth = {
  loginSuccess: (email, userId) => logger.info('User logged in', { email, userId, action: 'LOGIN_SUCCESS' }),
  loginFailure: (email, reason) => logger.warn('Login failed', { email, reason, action: 'LOGIN_FAILURE' }),
  registerSuccess: (email, userId) => logger.info('User registered', { email, userId, action: 'REGISTER_SUCCESS' }),
  logout: (userId) => logger.info('User logged out', { userId, action: 'LOGOUT' }),
  otpSent: (email) => logger.info('OTP sent', { email, action: 'OTP_SENT' }),
  otpVerified: (email) => logger.info('OTP verified', { email, action: 'OTP_VERIFIED' }),
  otpFailed: (email, reason) => logger.warn('OTP verification failed', { email, reason, action: 'OTP_FAILED' }),
  passwordReset: (email) => logger.info('Password reset', { email, action: 'PASSWORD_RESET' })
};

const logApplication = {
  applySuccess: (studentId, jobId) => logger.info('Application submitted', { studentId, jobId, action: 'APPLY_SUCCESS' }),
  applyFailure: (studentId, jobId, reason) => logger.warn('Application failed', { studentId, jobId, reason, action: 'APPLY_FAILURE' }),
  statusUpdate: (applicationId, status, updatedBy) => logger.info('Application status updated', { applicationId, status, updatedBy, action: 'STATUS_UPDATE' })
};

const logAudit = {
  accessDenied: (userId, resource, reason) => logger.warn('Access denied', { userId, resource, reason, action: 'ACCESS_DENIED' }),
  unauthorizedAction: (userId, action) => logger.warn('Unauthorized action attempted', { userId, action, action_type: 'UNAUTHORIZED_ATTEMPT' }),
  dataAccess: (userId, resource) => logger.info('Data accessed', { userId, resource, action: 'DATA_ACCESS' })
};

const logSystem = {
  startup: () => logger.info('Server starting', { action: 'SERVER_STARTUP' }),
  shutdown: () => logger.info('Server shutting down', { action: 'SERVER_SHUTDOWN' }),
  error: (error, context) => logger.error('System error', { error: error.message, stack: error.stack, ...context })
};

module.exports = {
  logger,
  logAuth,
  logApplication,
  logAudit,
  logSystem
};
