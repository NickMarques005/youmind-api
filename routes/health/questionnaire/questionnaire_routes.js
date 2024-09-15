const express = require('express');
const router = express.Router();
const questionnaireController = require('../../../controller/health/questionnaire/questionnaireController');
const tokenMiddleware = require('../../../middlewares/tokenMiddleware');

router.get('/', tokenMiddleware.verifyUidToken, questionnaireController.getQuestionnaires);
router.get('/template/:id', tokenMiddleware.verifyUidToken, questionnaireController.getQuestionnaireTemplateById);
router.post('/answers/add', tokenMiddleware.verifyUidToken, questionnaireController.SendAnswers);
router.get('/page', tokenMiddleware.verifyUidToken, questionnaireController.getPaginationQuestionnaires);

module.exports = router;