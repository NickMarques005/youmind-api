const express = require('express');
const router = express.Router();
const authController = require('../../controller/auth/authController')
const registrationController = require('../../controller/auth/registrationController');
const passwordController = require('../../controller/auth/passwordController');
const tokenController = require('../../controller/auth/tokenController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');
const validateMiddleware = require('../../middlewares/validationMiddleware');
const { isResetTokenValid } = require('../../middlewares/resetpassMIddleware');

router.post('/register',
    validateMiddleware.validateCreateUser,
    registrationController.registerUser
);
router.post('/verify-email', registrationController.verifyEmail);
router.post('/renew-otp', registrationController.renewOTP);
router.post('/login',
    validateMiddleware.validateLoginUser,
    authController.authenticateUser
);
router.post('/logout', tokenMiddleware.verifyUidToken, authController.logoutUser);

router.post('/refresh-token', tokenController.refreshToken);

router.post('/forgot-password', passwordController.forgotPassword);
router.get('/verify-pass-token', isResetTokenValid, authController.confirmRequest);
router.post('/reset-password', isResetTokenValid, passwordController.resetPassword);

module.exports = router;



