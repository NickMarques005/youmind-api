const express = require('express');
const router = express.Router();
const questionnaireTemplateController = require('../../../controller/admin/template/questionnaireTemplateController');

router.post('/create', questionnaireTemplateController.createTemplate);

module.exports = router;