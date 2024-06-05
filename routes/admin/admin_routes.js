const express = require('express');
const router = express.Router();
const oauthController = require('../../controller/oauth/OAuthController');

const questionnaireTemplateRoutes = require('./template/questionnaire_template_routes');

router.post('/oauth/email/save', oauthController.saveEmail);
router.put('/oauth/email/update', oauthController.updateEmail);
router.use('/template/questionnaire', questionnaireTemplateRoutes);

module.exports = router;