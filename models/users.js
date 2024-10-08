
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userStandardFields = {
    uid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: '',
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: false
    },
    birth: {
        type: Date,
        required: false
    },
    type: {
        type: String,
        enum: ["patient", "doctor"],
        required: true
    },
    verified: {
        type: Boolean,
        default: false,
        required: false
    },
    pushTokenKeys: [{
        type: String
    }],
    online: {
        type: Boolean,
        default: false,
        required: false
    },
    welcomeTreatment: {
        type: Boolean,
        default: false,
        required: false
    },
    private: {
        type: Boolean,
        default: false
    },
    private_treatment: {
        type: Boolean,
        default: false
    }
}

const patientUserSchema = new Schema({
    ...userStandardFields,
    is_treatment_running: {
        type: Boolean,
        default: false
    },
});

const doctorUserSchema = new Schema({
    ...userStandardFields,
    doctor_crm: {
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

const PatientUser = mongoose.model('patient_user', patientUserSchema, 'patient_forms_data');
const DoctorUser = mongoose.model('doctor_user', doctorUserSchema, 'doctor_forms_data');

module.exports = { PatientUser, DoctorUser };