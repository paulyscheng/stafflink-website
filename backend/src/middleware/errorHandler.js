const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        error = { 
          message: 'Duplicate entry. This record already exists.', 
          statusCode: 409 
        };
        break;
      case '23503': // foreign_key_violation
        error = { 
          message: 'Referenced record does not exist.', 
          statusCode: 400 
        };
        break;
      case '23502': // not_null_violation
        error = { 
          message: 'Required field is missing.', 
          statusCode: 400 
        };
        break;
      case '42P01': // undefined_table
        error = { 
          message: 'Database table not found.', 
          statusCode: 500 
        };
        break;
      default:
        error = { 
          message: 'Database error occurred.', 
          statusCode: 500 
        };
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;