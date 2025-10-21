const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(toEmail, token) {
  const link = `${process.env.FRONTEND_URL}/student/verify?token=${encodeURIComponent(token)}`;
  const info = await transporter.sendMail({
    from: `"no-reply | TPO Portal" ${process.env.FROM_EMAIL}`,
    to: toEmail,
    subject: "Verify your email - T&P Portal",
    html: `
      <p>Hi,</p>
      <p>Click the link below to verify your email. This link is valid for 10 minutes.</p>
      <p><a href="${link}">Verify Email</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
  return info;
}

async function sendWelcomeEmail(toEmail, name) {
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: toEmail,
    subject: "Welcome to T&P Portal",
    html: `<p>Hi ${name},</p><p>Welcome! Your account has been created.</p>`,
  });
  return info;
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };
