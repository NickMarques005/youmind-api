//----treatment_route.js----//

const express = require('express');
const router = express.Router();
const treatment_controller = require('../controller/treatmentController');

router.post('/initializeTreatment', treatment_controller.initializeTreatment);

router.post('/getTreatment', treatment_controller.getTreatment);

router.post('/deleteTreatment', treatment_controller.deleteTreatment);

module.exports = router;