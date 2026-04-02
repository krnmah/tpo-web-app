const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Email configuration cache
let cachedConfig = null;
let transporter = null;

/**
 * Get current SMTP configuration
 */
function getConfig() {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
}

/**
 * Check if configuration has changed
 */
function hasConfigChanged() {
  const currentConfig = getConfig();
  if (!cachedConfig) return true;

  return (
    currentConfig.host !== cachedConfig.host ||
    currentConfig.port !== cachedConfig.port ||
    currentConfig.auth.user !== cachedConfig.auth.user ||
    currentConfig.auth.pass !== cachedConfig.auth.pass
  );
}

/**
 * Initialize or reinitialize email transporter
 */
function initEmail() {
  // If config has changed, reset transporter
  if (hasConfigChanged()) {
    transporter = null;
  }

  if (transporter) return transporter;

  const config = getConfig();
  cachedConfig = config;

  // Check if credentials are available
  if (!config.auth.user || !config.auth.pass) {
    logger.warn('Email credentials not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false, // Use STARTTLS for port 587
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    },
    tls: {
      // Required for Gmail
      minVersion: 'TLSv1.2'
    }
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email configuration error', { error: error.message });
    } else {
      logger.info('Email server is ready', { smtp: config.host, user: config.auth.user });
    }
  });

  return transporter;
}

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
async function sendOTP(email, otp) {
  // Reinitialize email to pick up new config
  const mailTransporter = initEmail();

  if (!mailTransporter) {
    logger.error('Email transporter not initialized - check SMTP credentials', { email });
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"TNP Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset OTP - TNP Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0B5ED7; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .otp { font-size: 32px; font-weight: bold; color: #0B5ED7; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background: white; border: 2px dashed #0B5ED7; border-radius: 8px; }
          .warning { color: #e74c3c; font-size: 14px; text-align: center; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Training & Placement Portal</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password. Use the following OTP to proceed:</p>
            <div class="otp">${otp}</div>
            <p><strong>This OTP is valid for 5 minutes only.</strong></p>
            <p class="warning">⚠️ If you did not request this, please ignore this email.</p>
            <div class="footer">
              <p>NIT Srinagar Training & Placement Cell</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
TNP Portal - Password Reset OTP

Hello,

You have requested to reset your password. Use the following OTP to proceed:

OTP: ${otp}

This OTP is valid for 5 minutes only.

If you did not request this, please ignore this email.

---
NIT Srinagar Training & Placement Cell
This is an automated email. Please do not reply.
    `
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    logger.info('OTP email sent successfully', { email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send OTP email', { error: error.message, email });
    return false;
  }
}

/**
 * Send welcome email after registration
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @returns {Promise<boolean>} - Success status
 */
async function sendWelcomeEmail(email, name) {
  const mailTransporter = initEmail();

  if (!mailTransporter) {
    logger.info(`[DEV MODE] Welcome email would be sent to ${email}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"TNP Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to TNP Portal - NIT Srinagar',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TNP Portal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0B5ED7; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Training & Placement Portal</h1>
            <p>Welcome Aboard!</p>
          </div>
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Welcome to the Training & Placement Portal of NIT Srinagar!</p>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>View and apply for job opportunities</li>
              <li>Track your application status</li>
              <li>Update your profile and resume</li>
              <li>Get placement-related notifications</li>
            </ul>
            <p>Log in to your account to get started!</p>
            <div class="footer">
              <p>NIT Srinagar Training & Placement Cell</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await mailTransporter.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', { email });
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', { error: error.message, email });
    return false; // Don't fail registration if email fails
  }
}

// Don't initialize on module load - initialize on demand
module.exports = {
  sendOTP,
  sendWelcomeEmail,
  initEmail
};
