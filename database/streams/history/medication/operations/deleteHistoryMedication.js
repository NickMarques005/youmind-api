const { PatientMedicationHistory } = require('../../../../../models/patient_history');
const Treatment = require('../../../../../models/treatment');
const { emitHistoryMedicationUpdate, emitUpdateHistory } = require('../../../../../services/history/historyService');
const { formatLatestMedication } = require('../../../../../utils/history/formatHistory');

const handleDeleteHistoryMedication = async (change, io) => {
    const medicationHistoryId = change.documentKey._id;

    console.log("Histórico de medicamento excluído: ", medicationHistoryId);
}

module.exports = handleDeleteHistoryMedication;