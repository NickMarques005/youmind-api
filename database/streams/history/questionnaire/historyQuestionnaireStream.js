const { PatientQuestionnaireHistory } = require('../../../../models/patient_history');
const handleDeleteHistoryQuestionnaire = require('./operations/deleteHistoryQuestionnaire');
const handleInsertHistoryQuestionnaire = require('./operations/insertHistoryQuestionnaire');
const handleUpdateHistoryQuestionnaire = require('./operations/updateHistoryQuestionnaire');

const handleQuestionnaireHistoryChange = async (io, change) => {
    console.log("QuestionnaireHistory Change Stream Event: ", change);

    try {
        switch (change.operationType) {
            case 'insert':
                await handleInsertHistoryQuestionnaire(change, io);
                break;
            case 'update':
                await handleUpdateHistoryQuestionnaire(change, io);
                break;
            case 'delete':
                await handleDeleteHistoryQuestionnaire(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    } catch (error) {
        console.error('Erro ao lidar com a alteração do histórico do questionário:', error);
    }
};

const questionnaireHistoryStream = (io) => {
    const changeStream = PatientQuestionnaireHistory.watch();
    changeStream.on('change', change => handleQuestionnaireHistoryChange(io, change));
};

module.exports = questionnaireHistoryStream;