const treatment = require('../../models/treatment');
const notificationService = require('../../services/notificationService');
const { getTokenFromFirebase } = require('../../firebase/push_notification/push_notification');
const { PatientUser, DoctorUser } = require('../../models/users');

const handleTreatmentChange = (io, change) => {
    console.log("Treatment Change Stream Event: ", change);

    if (change.operationType === 'insert') {
        const updatedTreatment = change.fullDocument;
        const patientId = updatedTreatment.patientId;
        const doctorId = updatedTreatment.doctorId;

        console.log("DATA FROM CHANGE STREAM: ", patientId, doctorId);

        io.to(patientId).emit(patientId, { treatmentId: updatedTreatment._id });
        io.to(doctorId).emit(doctorId, { treatmentId: updatedTreatment._id });
    } else if (change.operationType === 'delete') {
        console.log("TRATAMENTO DELETADO!");
        const treatmentId = change.documentKey._id.toString();
        console.log(treatmentId);

        io.to(treatmentId).emit(treatmentId, { data: treatmentId });
    }
}

const treatmentStream = (io) => {
    const treatmentChangeStream = treatment.watch();
    treatmentChangeStream.on('change', change => handleTreatmentChange(io, change));
}

module.exports = treatmentStream;