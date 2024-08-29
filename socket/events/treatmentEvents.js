const { emitEventToUser } = require("../../utils/socket/connection");
const { getSocketServer } = require("../socket");

const emitTreatmentInitiate = async (emitData) => {
    try {
        const { io, patientInfo, doctorInfo } = emitData;

        let socketServer;
        if (!io) {
            const getIo = getSocketServer();
            socketServer = getIo;
        } else {
            socketServer = io;
        }

        await emitEventToUser(socketServer, patientInfo.patientId, 'treatmentInitiate', { treatment: patientInfo.treatment, notice: patientInfo.notice });
        await emitEventToUser(socketServer, doctorInfo.doctorId, 'treatmentInitiate', { treatment: doctorInfo.treatment, notice: doctorInfo.notice });
        
        console.log('Emissão de tratamento iniciado completa.');
    } catch (error) {
        console.error('Erro ao emitir tratamento iniciado:', error);
    }
};

const emitTreatmentComplete = async (emitData) => {
    try {
        const { io, patientInfo, doctorInfo } = emitData;

        let socketServer;
        if (!io) {
            const getIo = getSocketServer();
            socketServer = getIo;
        } else {
            socketServer = io;
        }

        await emitEventToUser(socketServer, patientInfo.patientId, 'treatmentComplete', { treatment: patientInfo.treatment, notice: patientInfo.notice });
        await emitEventToUser(socketServer, doctorInfo.doctorId, 'treatmentComplete', { treatment: doctorInfo.treatment, notice: doctorInfo.notice });
        
        console.log('Emissão de tratamento concluído completa.');
    } catch (error) {
        console.error('Erro ao emitir tratamento concluído:', error);
    }
};

const emitTreatmentDelete = async (emitData) => {
    try {
        const { io, patientInfo, doctorInfo } = emitData;

        let socketServer;
        if (!io) {
            const getIo = getSocketServer();
            socketServer = getIo;
        } else {
            socketServer = io;
        }

        await emitEventToUser(socketServer, patientInfo.patientId, 'treatmentDelete', { treatment: patientInfo.treatment });
        await emitEventToUser(socketServer, doctorInfo.doctorId, 'treatmentDelete', { treatment: doctorInfo.treatment });
        
        console.log('Emissão de tratamento deletado completa.');
    } catch (error) {
        console.error('Erro ao emitir tratamento deletado:', error);
    }
};

module.exports = { emitTreatmentInitiate, emitTreatmentComplete, emitTreatmentDelete };