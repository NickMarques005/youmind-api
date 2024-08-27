
const mongoose = require('mongoose');

const TreatmentSessionSchema = new mongoose.Schema({
    engagedDoctor: {
        _id: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true 
        },
        name: { 
            type: String, 
            required: true 
        }
    },
    period: {
        start: { 
            type: Date, 
            required: true 
        },
        end: { 
            type: Date,
            required: false
        }  
    },
    finalPerformance: { 
        type: Number
    }
});

const treatmentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: false
    },
    doctorId: {
        type: String,
        required: false
    },
    status: {
        type: String,
        default: "pending",
        enum: ["active", "expired", "completed"]
    },
    wasCompleted: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    sessions: [
        TreatmentSessionSchema
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Treatment = mongoose.model('treatment', treatmentSchema, 'treatment_data');

module.exports = Treatment;