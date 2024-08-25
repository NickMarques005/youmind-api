const Medication = require('../../../models/medication');
const handleDeleteMedication = require('./operations/deleteMedication');
const handleInsertMedication = require('./operations/insertMedication');
const handleUpdateMedication = require('./operations/updateMedication');

const handleMedicationChange = async (io, change) => {
    console.log("medication Change Stream Event: ", change);

    try{
        switch (change.operationType) {
            case 'insert':
                await handleInsertMedication(change, io);
                break;
            case 'update':
                await handleUpdateMedication(change, io);
                break;
            case 'delete':
                await handleDeleteMedication(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    }
    catch (error)
    {
        console.error('Erro ao lidar com a alteração do medicamento:', error);
    }
};

const medicationStream = (io) => {
    const changeStream = Medication.watch();
    changeStream.on('change', change => handleMedicationChange(io, change));
};

module.exports = medicationStream;