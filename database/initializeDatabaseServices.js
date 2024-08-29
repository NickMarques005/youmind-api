const { initializeAgenda } = require("../agenda/agenda_manager");
const initializeSQS = require("../aws/sqs/sqs_manager");
const { getSocketServer, initializeSocket } = require("../socket/socket");
const { initializeChangeStreams } = require("./streams");

const initializeDatabaseServices = async (httpServer, dbURI) => {
    // Inicialização do Socket Server
    initializeSocket(httpServer);

    // Obter instância de Socket Server e então iniciar Change Streams com o socket server
    const io = getSocketServer();
    initializeChangeStreams({ io });

    //Inicialização de SQS
    initializeSQS();
    
    // Inicialização de Agenda
    await initializeAgenda(dbURI);
};

module.exports = { initializeDatabaseServices };