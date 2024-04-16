//----treatment_route.js----//

const express = require('express');
const router = express.Router();
const treatment_controller = require('../../controller/treatment/treatmentController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

router.post('/initialize', tokenMiddleware.verifyToken, treatment_controller.initializeTreatment);
router.get('/', tokenMiddleware.verifyToken, treatment_controller.getTreatment);
router.post('/delete', tokenMiddleware.verifyToken, treatment_controller.deleteTreatment);

module.exports = router;