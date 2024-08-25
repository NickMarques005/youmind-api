const express = require('express');
const router = express.Router();
const solicitationController = require('../../controller/solicitation/solicitationController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

router.post('/create', tokenMiddleware.verifyUidToken, solicitationController.createSolicitation);
router.post('/decline', tokenMiddleware.verifyUidToken, solicitationController.declineSolicitation);

module.exports = router;