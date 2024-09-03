const mongoose = require('mongoose');

const MotivationalPhraseTemplateSchema = new mongoose.Schema({
    text: { 
        type: String, 
        required: true 
    }
});

const MotivationalPhraseTemplate = mongoose.model('MotivationalPhraseTemplate', MotivationalPhraseTemplateSchema, 'motivational_phrase_templates');

module.exports = MotivationalPhraseTemplate;