const { getPatientHistoryById } = require("../../services/history/historyService");
const { emitEventToUser } = require("../../utils/socket/connection");
const { getSocketServer } = require("../socket");

const emitUpdateHistory = async (emitData) => {
    const { io, doctorId, patientId} = emitData;

    try {
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        const updateHistory = await getPatientHistoryById(patientId);
        if (updateHistory) {
            await emitEventToUser(socketServer, doctorId, "updateHistory", { history: updateHistory });
        }
    } catch (error) {
        console.error('Erro ao emitir histórico:', error);
    }
};

const emitHistoryMedicationUpdate = async (io, doctorId, latestMedication) => {
    try {
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        console.log("Latest Medication: ", latestMedication);
        if (await emitEventToUser(socketServer, doctorId, "updateLatestMedication", { latestMedication })) {
            console.log(`Histórico de medicamentos emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de medicamentos:', error);
    }
};

const emitHistoryMedicationDelete = async (emitData) => {
    const {io, doctorId, latestMedication} = emitData;

    try {
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        console.log("Latest Medication: ", latestMedication);
        if (await emitEventToUser(socketServer, doctorId, "deleteLatestMedication", { latestMedication })) {
            console.log(`Histórico de medicamentos emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de medicamentos:', error);
    }
};

const emitHistoryQuestionnaireUpdate = async (emitData) => {
    const { io, doctorId, latestQuestionnaire } = emitData;

    try {
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        console.log(latestQuestionnaire);
        if (await emitEventToUser(socketServer, doctorId, "updateLatestQuestionnaire", { latestQuestionnaire })) {
            console.log(`Histórico de questionários emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de questionários:', error);
    }
};

const emitHistoryQuestionnaireDelete = async (emitData) => {
    const { io, doctorId, latestQuestionnaire } = emitData;

    try {
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        console.log(latestQuestionnaire);
        if (await emitEventToUser(socketServer, doctorId, "deleteLatestQuestionnaire", { latestQuestionnaire })) {
            console.log(`Histórico de questionários emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de questionários:', error);
    }
};

module.exports = { 
    emitUpdateHistory, 
    emitHistoryMedicationUpdate, 
    emitHistoryMedicationDelete, 
    emitHistoryQuestionnaireUpdate,
    emitHistoryQuestionnaireDelete
}