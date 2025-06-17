"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutHandler = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.logError = exports.ApplicationError = void 0;
class ApplicationError extends Error {
    constructor(message, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'ApplicationError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
const logError = (error, req, userId) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: error.message,
        stack: error.stack,
        status: error.status || 500,
        code: error.code || 'UNKNOWN_ERROR',
        userId: userId || 'anonymous',
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query
    };
    console.error('API Error:', JSON.stringify(errorLog, null, 2));
};
exports.logError = logError;
const errorHandler = (error, req, res, next) => {
    const userId = req.user?.id;
    (0, exports.logError)(error, req, userId);
    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    if (error instanceof ApplicationError) {
        status = error.status;
        message = error.message;
        code = error.code;
    }
    else if (error.name === 'ValidationError') {
        status = 400;
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
    }
    else if (error.name === 'CastError') {
        status = 400;
        message = 'Invalid data format';
        code = 'INVALID_FORMAT';
    }
    else if (error.code === '23505') {
        status = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
    }
    else if (error.code === '23503') {
        status = 400;
        message = 'Referenced resource not found';
        code = 'INVALID_REFERENCE';
    }
    else if (error.message.includes('JWT')) {
        status = 401;
        message = 'Authentication failed';
        code = 'AUTH_ERROR';
    }
    res.status(status).json({
        success: false,
        error: message,
        code: code,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.details || error.message
        })
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new ApplicationError(`Route ${req.method} ${req.url} not found`, 404, 'NOT_FOUND');
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const timeoutHandler = (timeout = 10000) => {
    return (req, res, next) => {
        const timer = setTimeout(() => {
            const error = new ApplicationError('Request timeout', 408, 'REQUEST_TIMEOUT');
            next(error);
        }, timeout);
        res.on('finish', () => {
            clearTimeout(timer);
        });
        next();
    };
};
exports.timeoutHandler = timeoutHandler;
//# sourceMappingURL=errorHandler.js.map