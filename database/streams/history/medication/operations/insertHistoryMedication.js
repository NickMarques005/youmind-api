const { PatientMedicationHistory } = require('../../../../../models/patient_history');
const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory, emitHistoryMedicationUpdate } = require('../../../../../services/history/historyService');
const { formatLatestMedication } = require('../../../../../utils/history/formatHistory');

const handleInsertHistoryMedication = async (change, io) => {

    console.log("PENDING!");
    const medicationHistoryId = change.documentKey._id;
    const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);

    if (!medicationHistory) {
        console.error(`Histórico de medicação não encontrado: ${medicationHistoryId}`);
        return;
    }
    console.log("Novo medicamento inserido: ", medicationHistory);

    const patientId = medicationHistory.patientId;
    const treatment = await Treatment.findOne({ patientId: patientId });
    if (!treatment) {
        console.log("Tratamento não encontrado");
        return;
    }

    const doctorId = treatment.doctorId;

    const latestMedication = await formatLatestMedication(medicationHistory);

    await emitUpdateHistory(io, doctorId, patientId);
    await emitHistoryMedicationUpdate(io, doctorId, { latestMedication }, "updateLatestMedication");
}

module.exports = handleInsertHistoryMedication;