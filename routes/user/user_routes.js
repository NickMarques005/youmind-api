//---user_routes.js---//

const express = require('express');
const router = express.Router();
const userController = require('../../controller/user/userController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware'); 

router.post('/filter', tokenMiddleware.verifyToken, userController.filterUsers);
router.get('/get-data', tokenMiddleware.verifyToken, userController.userData);

module.exports = router;