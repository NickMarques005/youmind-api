//---users.js---//

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const userStandardFields = {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    verified: {
        type:Boolean,
        default: false,
        required: false
    },
    avatar: {
        type: String,
        default: '',
    }
}

const patientUserSchema = new Schema({
    ...userStandardFields,
    is_treatment_running: {
        type: Boolean,
        default: false
    }
});

const doctorUserSchema = new Schema({
    ...userStandardFields,
    doctor_crm: {
        type: String,
        required: true
    },
    total_treatments: [
        {
            type: Array,
            default: []
        }
    ]
});

patientUserSchema.methods.comparePassword = async function(pass) {
    const result = await bcrypt.compareSync(pass, this.password);
    return result;
};

doctorUserSchema.methods.comparePassword = async function(pass) {
    const result = await bcrypt.compareSync(pass, this.password);
    return result;
};

const PatientUser = mongoose.model('patient_user', patientUserSchema, 'patient_forms_data');
const DoctorUser = mongoose.model('doctor_user', doctorUserSchema, 'doctor_forms_data');

module.exports = { PatientUser, DoctorUser };
