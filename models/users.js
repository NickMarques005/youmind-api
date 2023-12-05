//---users.js---//

const mongoose = require('mongoose');

const { Schema } = mongoose;

const patientUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    is_treatment_running: {
        type: Boolean,
        default: false
    }
});

const doctorUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    doctor_crm: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    total_treatments: [
        {
            type: String,
            default: []
        }
    ]
});

const PatientUser = mongoose.model('patient_user', patientUserSchema, 'patient_forms_data' );
const DoctorUser = mongoose.model('doctor_user', doctorUserSchema, 'doctor_forms_data');

module.exports = { PatientUser, DoctorUser };
