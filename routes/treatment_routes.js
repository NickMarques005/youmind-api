//----treatment_route.js----//

const express = require('express');
const router = express.Router();
const treatment_controller = require('../controller/treatmentController');
const tokenMiddleware = require('../middlewares/tokenMiddleware');

router.post('/initializeTreatment', tokenMiddleware.verifyToken, treatment_controller.initializeTreatment);
router.post('/getTreatment', tokenMiddleware.verifyToken, treatment_controller.getTreatment);
router.post('/deleteTreatment', tokenMiddleware.verifyToken, treatment_controller.deleteTreatment);

module.exports = router;