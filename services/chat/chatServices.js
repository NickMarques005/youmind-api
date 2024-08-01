const Message = require("../../models/message");
const { emitEventToUser } = require("../../utils/socket/connection");

const getInitialChatData = async (treatmentId, userUid) => {
    try {
        if(!treatmentId || !userUid) return console.log("Houve um erro ao buscar os dados do chat: Dados de parametros inválidos");

        const lastMessage = await Message.findOne({ conversationId: treatmentId }).sort({ createdAt: -1 });
        const unreadMessagesCount = await Message.countDocuments({
            conversationId: treatmentId,
            readBy: { $ne: userUid }, 
            sender: { $ne: userUid } 
        });

        return {
            last_msg: lastMessage ? { content: lastMessage.content, date: lastMessage.createdAt } : null,
            msg_count: unreadMessagesCount
        }
    }
    catch (err) {
        console.error('Houve um erro ao buscar os dados do chat');
        return { last_msg: undefined, msg_count: 0 }
    }
}

const emitInitialChatUpdate = async (io, userId, updatedChat, event) => {
    try {
        console.log("Chat inicial atualizado: ", updatedChat);
        if (await emitEventToUser(io, userId, event, { updatedChat })) {
            console.log(`Chat inicial emitido para a sala ${userId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir chat inicial:', error);
    }
}

module.exports = { getInitialChatData, emitInitialChatUpdate };