const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    content: {
        type: [String],
        default: [],
    },
    doctor_id: {
        type: String,
        required: true,
    },
},
    { timestamps: true }
    );

const Note = mongoose.model('notes', noteSchema, 'notepad_data');

module.exports = Note;