const multer = require('multer');

module.exports = (err, req, res, next) => {
    const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
    const message = err.message || 'Error inesperado';

    if (status >= 500) {
        console.error('[errorHandler]', err);
    } else {
        console.warn('[errorHandler]', message);
    }

    res.status(status).json({
        message,
    });
};