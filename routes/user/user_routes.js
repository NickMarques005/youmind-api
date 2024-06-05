
const express = require('express');
const router = express.Router();
const userController = require('../../controller/user/userController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware'); 

router.get('/filter', tokenMiddleware.verifyUidToken, userController.filterUsers);
router.get('/data', tokenMiddleware.verifyUidToken, userController.userData);
router.post('/update/avatar', tokenMiddleware.verifyUidToken, userController.updateUserAvatar);
router.post('/update/details', tokenMiddleware.verifyUidToken, userController.updateUserDetails);

module.exports = router;