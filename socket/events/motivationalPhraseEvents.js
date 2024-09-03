const { emitEventToUser } = require("../../utils/socket/connection");
const { getSocketServer } = require("../socket");

const emitNewMotivationalPhrase = async (emitData) => {
    try {
        const {io, newMotivationalPhrase } = emitData;
        let socketServer;
        if(!io)
        {
            const getIo = getSocketServer();
            socketServer = getIo
        }
        else{
            socketServer = io;
        }

        console.log("Nova frase motivacional mandada por socket: ", newMotivationalPhrase);
        await emitEventToUser(socketServer, newMotivationalPhrase.patientId, "newMotivationalPhraseOfTheDay", { newMotivationalPhrase });
        
    } catch (error) {
        console.error('Erro ao emitir histórico:', error);
    }
}

module.exports = { emitNewMotivationalPhrase }