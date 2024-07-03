const { PatientMedicationHistory } = require('../../../../models/patient_history');
const handleInsertHistoryMedication = require('./operations/insertHistoryMedication');
const handleUpdateHistoryMedication = require('./operations/updateHistoryMedication');
const handleDeleteHistoryMedication = require('./operations/deleteHistoryMedication');

const handleMedicationHistoryChange = async (io, change) => {
    console.log("MedicationHistory Change Stream Event: ", change);

    try{
        switch (change.operationType) {
            case 'insert':
                await handleInsertHistoryMedication(change, io);
                break;
            case 'update':
                await handleUpdateHistoryMedication(change, io);
                break;
            case 'delete':
                await handleDeleteHistoryMedication(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    }
    catch (error)
    {
        console.error('Erro ao lidar com a alteração do histórico do medicamento:', error);
    }
};

const medicationHistoryStream = (io) => {
    const changeStream = PatientMedicationHistory.watch();
    changeStream.on('change', change => handleMedicationHistoryChange(io, change));
};

module.exports = medicationHistoryStream;