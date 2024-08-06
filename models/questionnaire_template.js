const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
    {
        answer: { type: String, required: true },
        type: { type: String, enum: ['precisa_melhorar', 'ruim', 'bom', 'ótimo', 'excelente'], required: true },
        hasMetadata: { type: Boolean, required: false }
    }
    , { _id: false });

const questionTemplateSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        answers: [answerSchema],
        sub_questions: {
            type: [{ type: String, required: true }],
            required: false
        },
        responsePeriod: { type: Number, required: false },
        responseTime: { type: String, enum: ['dias', 'meses'], required: false }
    },
    { _id: true });

const questionnaireTemplateSchema = new mongoose.Schema(
    {
        questions: [questionTemplateSchema],
        time: {
            type: String,
            enum: ['matutino', 'noturno'],
            required: true
        },
    },
    { timestamps: true });

const QuestionnaireTemplate = mongoose.model('QuestionnaireTemplate', questionnaireTemplateSchema, "questionnaire_template_data");

module.exports = QuestionnaireTemplate;