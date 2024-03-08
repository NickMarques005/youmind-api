//---validationMiddleware.js---//

const { body, validationResult } = require('express-validator');

const validateCreateUser = [
    body('email').isEmail(),
    body('name').isLength({ min: 3, max: 25 }),
    body('password').isLength({ min: 8 }),
    body('type').not().isEmpty(),
    body('phone').not().isEmpty(),
    body('doctor_crm').if(body('type').equals('doctor')).not().isEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const extractedErrors = errors.array().map(err => err.msg);
            return res.status(400).json({ success: false, errors: extractedErrors })
        }
        next();
    }
];

const validateLoginUser = [
    body('email', 'Email incorreto').isEmail(),
    body('password', 'A senha está incorreta! Ela deve ter no mínimo 8 caracteres.').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const extractedErrors = errors.array().map(err => err.msg);
            return res.status(400).json({ success: false, errors: extractedErrors })
        }
        next();
    }
];


module.exports = {
    validateCreateUser,
    validateLoginUser
}