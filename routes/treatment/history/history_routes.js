const express = require('express');
const router = express.Router();
const historyController = require('../../../controller/treatment/historyController');
const tokenMiddleware = require('../../../middlewares/tokenMiddleware');

router.get('/doctor/all', tokenMiddleware.verifyUidToken, historyController.getAllHistory);
router.get('/doctor/latest', tokenMiddleware.verifyUidToken, historyController.getLatestHistory);
router.get('/patient/questions', tokenMiddleware.verifyUidToken, historyController.getQuestionPerformance );
router.get('/doctor/questionnaires', tokenMiddleware.verifyUidToken, historyController.getHistoryQuestionnairesForCurrentPatient);
router.get('/doctor/medications', tokenMiddleware.verifyUidToken, historyController.getHistoryMedicationsForCurrentPatient);

module.exports = router;