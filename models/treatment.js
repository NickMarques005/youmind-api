
const mongoose = require('mongoose');

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
        enum: ["pending", "active", "declined", "expired", "completed"]
    },
    wasCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24*60* 60*1000),
    }
});

treatmentSchema.index({ expiresAt: 1 }, { sparse: true, expireAfterSeconds: 0 });

const Treatment = mongoose.model('treatment', treatmentSchema, 'treatment_data');

module.exports = Treatment;