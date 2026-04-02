// Re-export from auth.js for backward compatibility
const { hashPassword, comparePassword } = require('./auth');

module.exports = {
  hashPassword,
  comparePassword
};
