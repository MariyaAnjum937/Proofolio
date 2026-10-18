const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!supportedTypes.includes(file.mimetype)) {
            const error = new Error('Only PDF, JPEG, PNG, and WebP files are supported.');
            error.code = 'UNSUPPORTED_FILE_TYPE';
            return callback(error);
        }
        return callback(null, true);
    }
});

module.exports = upload;