const path = require('path');

function isPdf(file) {
  const ext = (file.originalname || '').toLowerCase();
  return (
    file.mimetype === 'application/pdf' ||
    ext.endsWith('.pdf')
  );
}

function isImage(file) {
  const ext = (file.originalname || '').toLowerCase();
  return (
    file.mimetype.startsWith('image/') ||
    ext.endsWith('.jpg') ||
    ext.endsWith('.jpeg') ||
    ext.endsWith('.png')
  );
}

function isNitsriEmail(email) {
  return typeof email === 'string' && email.toLowerCase().endsWith('@nitsri.ac.in');
}

module.exports = { isPdf, isImage, isNitsriEmail };
