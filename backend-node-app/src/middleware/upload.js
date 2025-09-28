const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
        error.message = 'La imagen debe ser JPG o PNG.';
        return cb(error);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});

module.exports = upload;
