//---validationMiddleware.js---//

const { body, validationResult } = require('express-validator');
const { HandleError } = require('../utils/response/handleResponse');

const validateCreateUser = [
    body('email', 'Email incorreto').isEmail(),
    body('name', "O nome precisa ter entre 3 à 25 caracteres!").isLength({ min: 3, max: 25 }),
    body('password', "É recomendado que sua senha precise de no mínimo 8 caracteres! Tome cuidado com senha fraca").isLength({ min: 8 }),
    body('type', "Tipo de usuário não especificado").not().isEmpty(),
    body('phone', "Número de telefone não especificado!").not().isEmpty(),
    body('doctor_crm', "CRM inválido").if(body('type').equals('doctor')).not().isEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const extractedErrors = errors.array().map(err => err.msg);
            const errorMessage = extractedErrors.join(" | ");
            return HandleError(res, 400, errorMessage);
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
            const errorMessage = extractedErrors.join(" | ");
            return HandleError(res, 400, errorMessage);
        }
        next();
    }
];


module.exports = {
    validateCreateUser,
    validateLoginUser
}