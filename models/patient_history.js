const mongoose = require('mongoose');

const medicationHistorySchema = new mongoose.Schema(
    {
        medicationId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        frequency: {
            type: Number,
            required: true
        },
        start: {
            type: Date,
            required: true
        },
        expiresAt: {
            type: Date,
            required: true
        },
        schedules: {
            type: [String],
            required: true
        },
        alarmDuration: {
            type: Number,
            required: true
        },
        reminderTimes: {
            type: Number,
            required: true
        },
        taken: {
            type: Boolean,
            required: false
        },
        pending: {
            type: Boolean,
            default: true
        },
        alert: {
            type: Boolean,
            required: false
        },
        currentSchedule: {
            type: String,
            required: true
        },
        consumeDate: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
);

const answerSchema = new mongoose.Schema({
    answer: { type: String },
    type: { type: String }
});

const formattedAnswerSchema = new mongoose.Schema({
    answer: { type: String },
    type: { type: String },
    subAnswers: { type: [answerSchema] }
}, { _id: false });

const questionnaireHistorySchema = new mongoose.Schema(
    {
        questionnaireId: {
            type: String,
            required: true,
        },
        answered: {
            type: Boolean,
            required: false
        },
        pending: {
            type: Boolean,
            default: true
        },
        answers: {
            type: [formattedAnswerSchema],
            required: false
        },
    },
    { timestamps: true }
);

const patientQuestionnaireHistorySchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    questionnaire: questionnaireHistorySchema,
    treatmentId: {
        type: String,
        required: true
    },
    delete: { 
        type: Boolean, 
        default: false
    },
});

const patientMedicationHistorySchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    medication: medicationHistorySchema,
    treatmentId: {
        type: String,
        required: true
    },
    delete: { 
        type: Boolean, 
        default: false
    },
});


const PatientQuestionnaireHistory = mongoose.model('PatientQuestionnaireHistory', patientQuestionnaireHistorySchema, "patient_history_questionnaire_data");
const PatientMedicationHistory = mongoose.model('PatientMedicationHistory', patientMedicationHistorySchema, "patient_history_medication_data");

module.exports = { PatientQuestionnaireHistory, PatientMedicationHistory };