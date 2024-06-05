const mongoose = require('mongoose');
const { getDefaultExpirationDate } = require('../utils/db/db_helpers');

const answerSchema = new mongoose.Schema({
    answer: { type: String},
    type: { type: String }
})

const formattedAnswerSchema = new mongoose.Schema({
    answer: { type: String },
    type: { type: String },
    subAnswers: { type: [answerSchema] }
}, { _id: false });

const questionnaireSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    expiredAt: {
        type: Date, 
        required: true ,
        default: getDefaultExpirationDate
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    name: {
        type: String,
        required: true
    },
    checked: {
        type: Boolean,
        default: false
    },
    questionnaireTemplateId: {
        type: String,
        required: true
    },
    answers: {
        type: [formattedAnswerSchema],
        required: false
    }
});

const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema, 'questionnaires_data');

module.exports = Questionnaire;