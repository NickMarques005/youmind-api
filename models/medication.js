const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    dosage: { 
        type: String, 
        required: true 
    },
    patientId: { 
        type: String,
        required: true 
    },
    type: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: false
    },
    frequency: {
        type: Number,
        required: false
    },
    schedules: {
        type: [String],
        default: []
    },
    isScheduled: {
        type: Boolean,
        default: false,
        required: false
    },
    start: {
        type: Date,
        required: false
    },
    alarmDuration: {
        type: Number,
        required: true
    },
    reminderTimes: {
        type: Number,
        required: true
    },
}, { timestamps: true });

medicationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Medication = mongoose.model('Medication', medicationSchema, 'medication_data');

module.exports = Medication;