const express = require('express');
const router = express.Router();
const tokenMiddleware = require('../../../middlewares/tokenMiddleware');
const motivationalPhraseController = require('../../../controller/treatment/motivationalPhraseController');

router.get('/all', tokenMiddleware.verifyUidToken, motivationalPhraseController.getAllMotivationalPhrasesFromPatient);
router.post('/confirm-viewing', tokenMiddleware.verifyUidToken, motivationalPhraseController.verify_Viewing);

module.exports = router;