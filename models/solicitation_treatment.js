const mongoose = require('mongoose');

const solicitationTreatmentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 43200
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const TreatmentRequest = mongoose.model('TreatmentRequest', solicitationTreatmentSchema, 'treatment_solicitations');

module.exports = TreatmentRequest;