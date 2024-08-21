const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate } = require('../../../../../services/history/historyService');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const { PatientUser } = require('../../../../../models/users');
const { formatLatestQuestionnaire } = require('../../../../../utils/history/formatHistory');

const handleDeleteHistoryQuestionnaire = async (change, io) => {
    const questionnaireHistoryId = change.documentKey._id;
    
    console.log("Histórico do questionário excluído: ", questionnaireHistoryId);
}

module.exports = handleDeleteHistoryQuestionnaire;