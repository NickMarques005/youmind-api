const express = require('express');
const router = express.Router();
const oauthController = require('../../controller/oauth/OAuthController');

router.post('/oauth/email/save', oauthController.saveEmail);
router.put('/oauth/email/update', oauthController.updateEmail);

module.exports = router;