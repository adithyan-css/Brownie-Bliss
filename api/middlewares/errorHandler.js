const { AppError } = require('../utils/customErrors');

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle Mongoose specific validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((el) => el.message);
    err.statusCode = 400;
    err.status = 'fail';
    err.message = `Invalid input data: ${messages.join('. ')}`;
  }

  // Handle duplicate key MongoDB errors
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    err.statusCode = 400;
    err.status = 'fail';
    err.message = `Duplicate field value: ${value}. Please use another value!`;
  }

  // Handle JSON Web Token errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.status = 'fail';
    err.message = 'Invalid token. Please log in again!';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.status = 'fail';
    err.message = 'Your token has expired! Please log in again.';
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming/Unknown errors: don't leak details
      console.error('❌ ERROR:', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong on the server!',
      });
    }
  }
}

module.exports = errorHandler;
