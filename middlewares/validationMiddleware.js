const { body, validationResult } = require('express-validator');

const validateCreateUser = [
    body('email').isEmail(),
    body('name').isLength({ min: 3 }),
    body('password').isLength({ min: 8 }),
    body('type').not().isEmpty(),
    body('phone').not().isEmpty(),
    body('doctor_crm').if(body('type').equals('doctor')).not().isEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        next();
    }
];

const validateLoginUser = [
    body('email', 'Email incorreto').isEmail(),
    body('password', 'Senha incorreta').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validateResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        next();
    }
];


module.exports = {
    validateCreateUser,
    validateLoginUser
}