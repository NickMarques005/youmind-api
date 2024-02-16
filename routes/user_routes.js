//---user_routes.js---//

const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const tokenMiddleware = require('../middlewares/tokenMiddleware'); 

router.post('/filterUsers', tokenMiddleware.verifyToken, userController.filterUsers);
router.get('/userData', tokenMiddleware.verifyToken, userController.userData);

module.exports = router;