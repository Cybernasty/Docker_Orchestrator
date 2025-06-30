// Custom error classes for better error handling
export class ContainerError extends Error {
  constructor(message, statusCode = 500, containerId = null) {
    super(message);
    this.name = 'ContainerError';
    this.statusCode = statusCode;
    this.containerId = containerId;
    this.timestamp = new Date().toISOString();
  }
}

export class DockerError extends Error {
  constructor(message, statusCode = 500, operation = null) {
    super(message);
    this.name = 'DockerError';
    this.statusCode = statusCode;
    this.operation = operation;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.timestamp = new Date().toISOString();
  }
}

// Error handler middleware
export const errorHandler = (error, req, res, next) => {
  try {
    console.error("Error passed to errorHandler:", error, typeof error, error && error.statusCode);

    let statusCode = 500;
    if (
      error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 100 &&
      error.statusCode < 600
    ) {
      statusCode = error.statusCode;
    }
    const message =
      error && typeof error.message === 'string'
        ? error.message
        : 'Internal server error';

    res.status(statusCode || 500).json({
      error: {
        name: (error && error.name) || 'InternalError',
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: error && error.stack }),
      },
    });
  } catch (err) {
    // If even the error handler fails, send a generic 500
    res.status(500).json({
      error: {
        name: 'InternalError',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 