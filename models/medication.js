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
        required: true
    },
    frequency: {
        type: Number,
        required: true
    },
    schedules: {
        type: [String],
        required: true
    },
    isScheduled: {
        type: Boolean,
        default: false,
        required: false
    },
    start: {
        type: Date,
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
}, { timestamps: true });

medicationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Medication = mongoose.model('Medication', medicationSchema, 'medication_data');

module.exports = Medication;