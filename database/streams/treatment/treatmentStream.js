const Treatment = require('../../../models/treatment');
const handleInsertTreatment = require('./operations/insertTreatment');
const handleDeleteTreatment = require('./operations/deleteTreatment');
const handleUpdateTreatment = require('./operations/updateTreatment');

const handleTreatmentChange = async (io, change) => {
    console.log("Treatment Change Stream Event: ", change);

    try{
        switch (change.operationType) {
            case 'insert':
                await handleInsertTreatment(change, io);
                break;
            case 'update':
                await handleUpdateTreatment(change, io);
                break;
            case 'delete':
                await handleDeleteTreatment(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    }
    catch (error)
    {
        console.error('Erro ao lidar com a alteração do tratamento:', error);
    }
    
}

const treatmentStream = (io) => {
    const treatmentChangeStream = Treatment.watch();
    treatmentChangeStream.on('change', change => handleTreatmentChange(io, change));
}

module.exports = treatmentStream;