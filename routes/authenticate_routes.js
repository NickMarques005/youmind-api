//---authenticate_routes.js---//

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controller/authController')
const tokenMiddleware = require('../middlewares/tokenMiddleware'); 

router.post('/createUser',
    [
        body('email').isEmail(),
        body('name').isLength({ min: 3}),
        body('password').isLength({min: 8}),
        body('type').not().isEmpty(),
        body('phone').not().isEmpty(),
        body('doctor_crm').if(body('type').equals('doctor')).not().isEmpty()
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
        {
            return res.status(400).json({ errors: errors.array()});
        }
        authController.registerUser(req, res);
    }
)

router.post('/loginUser', body('email', 'E-mail incorreto').isEmail(),
    body('password', 'Senha incorreta').isLength({ min: 8 }),
    authController.authenticateUser
);

router.post('/logoutUser', tokenMiddleware.verifyToken, authController.logoutUser);

router.post('/refreshToken', authController.refreshToken);

module.exports = router;



