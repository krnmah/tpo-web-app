function errorHandler(err, req, res, next) {
  // Log internally in development, but never expose to client
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Send generic message to client
  res.status(err.status || 500).json({ error: err.clientMessage || 'Something went wrong. Please try again.' });
}

module.exports = errorHandler;
