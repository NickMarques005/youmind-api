const Message = require("../../models/message");

const getInitialChatData = async (treatmentId, userUid) => {
    try {
        if(!treatmentId || !userUid) {
            console.log("Houve um erro ao buscar os dados do chat: Dados de parametros inválidos");
            return undefined;
        }

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

module.exports = { getInitialChatData };