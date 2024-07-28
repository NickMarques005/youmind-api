const { PatientMedicationHistory } = require('../../../../../models/patient_history');
const Treatment = require('../../../../../models/treatment');
const { emitHistoryMedicationUpdate, emitUpdateHistory } = require('../../../../../services/history/historyService');

const handleDeleteHistoryMedication = async (change, io) => {
    const medicationHistoryId = change.documentKey._id;
    const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);

    if (!medicationHistory) {
        console.error(`Histórico de medicação não encontrado: ${medicationHistoryId}`);
        return;
    }

    console.log("Histórico de medicamento excluído: ", medicationHistory);

    const patientId = medicationHistory.patientId;
    const treatment = await Treatment.findOne({ patientId: patientId });
    if (!treatment) {
        console.log("Tratamento não encontrado");
        return;
    }

    const doctorId = treatment.doctorId;

    await emitUpdateHistory(io, doctorId, patientId);
    await emitHistoryMedicationUpdate(io, doctorId, medicationHistory, "deleteLatestMedication");
}

module.exports = handleDeleteHistoryMedication;