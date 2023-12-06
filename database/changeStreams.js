//---changeStreams.js---//

const treatment = require('../models/treatment');

const initializeChangeStream = async (io) => {

    const treatmentChangeStream = treatment.watch();

    treatmentChangeStream.on('change', async (change) => {
        console.log("Treatment Change Stream Event: ", change);

        if (change.ns.coll === 'treatment_data') {
            if (change.operationType === 'insert') {
                const updatedTreatment = change.fullDocument;
                const patientId = updatedTreatment.patientId;
                const doctorId = updatedTreatment.doctorId;

                console.log("DATA FROM CHANGE STREAM: ", patientId, doctorId);

                io.to(patientId).emit(patientId, { treatmentId: updatedTreatment._id })
                io.to(doctorId).emit(doctorId, { treatmentId: updatedTreatment._id });
            }
            else if (change.operationType === 'delete') {
                console.log("TRATAMENTO DELETADO!");
                const treatmentId = change.documentKey._id.toString();
                console.log(treatmentId);

                io.to(treatmentId).emit(treatmentId, { data: treatmentId});
            }
        }
    });
}

module.exports = { initializeChangeStream };

