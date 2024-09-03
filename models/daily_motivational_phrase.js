const mongoose = require('mongoose');

const DailyMotivationalPhraseSchema = new mongoose.Schema({
    patientId: { 
        type: String,
        required: true 
    },
    phraseId: { 
        type: String,
        required: true 
    },
    text: {
        type: String,
        required: true,
    },
    viewed: {
        type: Boolean,
        default: false
    },
    usedAt: { 
        type: Date,
        default: Date.now()
    }
});

const DailyMotivationalPhrase = mongoose.model('DailyMotivationalPhrase', DailyMotivationalPhraseSchema, 'daily_motivational_phrase');

module.exports = DailyMotivationalPhrase;