const Questionnaire = require('../../../models/questionnaire');
const handleDeleteQuestionnaire = require('./operations/deleteQuestionnaire');
const handleInsertQuestionnaire = require('./operations/insertQuestionnaire');
const handleUpdateQuestionnaire = require('./operations/updateQuestionnaire');

const handleQuestionnaireChange = async (io, change) => {
    console.log("Questionnaire Change Stream Event: ", change)

    try{
        switch (change.operationType) {
            case 'insert':
                await handleInsertQuestionnaire(change, io);
                break;
            case 'update':
                await handleUpdateQuestionnaire(change, io);
                break;
            case 'delete':
                await handleDeleteQuestionnaire(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    }
    catch (error)
    {
        console.error('Erro ao lidar com a alteração do questionário:', error);
    }
};

const questionnaireStream = (io) => {
    const changeStream = Questionnaire.watch();
    changeStream.on('change', change => handleQuestionnaireChange(io, change));
};

module.exports = questionnaireStream;