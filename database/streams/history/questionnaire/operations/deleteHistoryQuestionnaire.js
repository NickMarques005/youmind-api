
const handleDeleteHistoryQuestionnaire = async (change, io) => {
    const questionnaireHistoryId = change.documentKey._id;
    
    console.log("Histórico do questionário excluído: ", questionnaireHistoryId);
}

module.exports = handleDeleteHistoryQuestionnaire;