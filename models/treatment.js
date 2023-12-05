//----treatment.js----//

const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true
    },
    doctorId: {
        type: String,
        required: true
    }
});

const Treatment = mongoose.model('treatment', treatmentSchema, 'treatment_data');

module.exports = Treatment;