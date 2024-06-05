const express = require('express');
const router = express.Router();
const medicationController = require('../../../controller/health/medication/medicationController');
const tokenMiddleware = require('../../../middlewares/tokenMiddleware');

router.get('/', tokenMiddleware.verifyUidToken, medicationController.getMedications);
router.post('/create', tokenMiddleware.verifyUidToken, medicationController.createMedication );
router.put('/update', tokenMiddleware.verifyUidToken, medicationController.updateMedication);
router.delete('/delete', tokenMiddleware.verifyUidToken, medicationController.deleteMedication);
router.delete('/delete/many', tokenMiddleware.verifyUidToken, );
router.get('/pending/', tokenMiddleware.verifyUidToken, medicationController.getMedicationPending);
router.post('/pending/confirm', tokenMiddleware.verifyUidToken, medicationController.confirmMedicationAlert);
router.get('/taken', tokenMiddleware.verifyUidToken, medicationController.getMedicationsTakenOnDate);
module.exports = router;