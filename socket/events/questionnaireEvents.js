const { emitEventToUser } = require("../../utils/socket/connection");
const { getSocketServer } = require("../socket");

const emitNewQuestionnaire = (emitData) => {
    const { patientId, newQuestionnaire } = emitData;

    const io = getSocketServer();

    try {
        if (emitEventToUser(io, patientId, "addNewQuestionnaire", { questionnaire: newQuestionnaire })) {
            console.log(`Novo questionário emitido para o paciente ${patientId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir novo questionário:', error);
    }
};

module.exports = { emitNewQuestionnaire };