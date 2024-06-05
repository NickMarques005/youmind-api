const express = require('express');
const router = express.Router();

const medicationRoutes = require('./medication/medication_routes');
const questionnaireRoutes = require('./questionnaire/questionnaire_routes');

router.use('/medication', medicationRoutes);
router.use('/questionnaire', questionnaireRoutes);


module.exports = router;