class AppError extends Error {
  constructor(msg, code) {
    super(msg);

    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
