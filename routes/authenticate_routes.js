//---authenticate_routes.js---//

const express = require('express');
const router = express.Router();
const authController = require('../controller/authController')
const tokenMiddleware = require('../middlewares/tokenMiddleware');
const validateMiddleware = require('../middlewares/validationMiddleware');
const { isResetTokenValid } = require('../middlewares/resetpassMIddleware');


router.post('/createUser',
    validateMiddleware.validateCreateUser,
    authController.registerUser
)

router.post('/verifyEmail', authController.verifyEmail);

router.post('/loginUser',
    validateMiddleware.validateLoginUser,
    authController.authenticateUser
);

router.post('/logoutUser', tokenMiddleware.verifyToken, authController.logoutUser);

router.post('/refreshToken', authController.refreshToken);

router.post('/forgotPassword', authController.forgotPassword);

router.get('/verifyPassToken', isResetTokenValid, authController.confirmRequest);

router.post('/reset-password', isResetTokenValid, authController.resetPass);

module.exports = router;



