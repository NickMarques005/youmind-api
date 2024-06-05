
const express = require('express');
const router = express.Router();
const treatment_controller = require('../../controller/treatment/treatmentController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

router.use('/history', require('./history/history_routes'));
router.post('/initialize', tokenMiddleware.verifyUidToken, treatment_controller.initializeTreatment);
router.get('/', tokenMiddleware.verifyUidToken, treatment_controller.getTreatment);
router.post('/end', tokenMiddleware.verifyUidToken, treatment_controller.endTreatment);

module.exports = router;