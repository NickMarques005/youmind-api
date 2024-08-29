const { emitEventToUser } = require("../../utils/socket/connection");

const emitInitialChatUpdate = async (emitData) => {
    const { io, userId, updatedChat } = emitData;
    
    try {
        console.log("Chat inicial atualizado: ", updatedChat);
        if (await emitEventToUser(io, userId, "updateInitialChat", { updatedChat })) {
            console.log(`Chat inicial emitido para a sala ${userId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir chat inicial:', error);
    }
}

module.exports = { emitInitialChatUpdate };