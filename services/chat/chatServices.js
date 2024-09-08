const Message = require("../../models/message");
const { PatientUser, DoctorUser } = require("../../models/users");

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

const getSenderName = async (senderUid, senderType) => {
    try {
        let user = null;
        if (senderType === "patient") {
            user = await PatientUser.findOne({ uid: senderUid });
        } else if (senderType === "doctor") {
            user = await DoctorUser.findOne({ uid: senderUid });
        }

        return user ? user.name : senderType === "doctor" ? "Doutor" : "Paciente";
    } catch (error) {
        console.error(`Erro ao buscar o sender (${senderUid}):`, error);
        return senderType === "doctor" ? "Doutor" : "Paciente";
    }
};

const formatMessagesContainingMentionedMessages = async (messages) => {
    try {
        const messagesWithMentioned = messages.filter((message, index) => {
            console.log(`Mensagem ${index + 1} - ${message}`);
            return message.mentionedMessageId
        });
        
        if (messagesWithMentioned.length === 0) return messages;

        const mentionedMessageIds = messagesWithMentioned.map(msg => msg.mentionedMessageId);
        const mentionedMessages = await Message.find({ _id: { $in: mentionedMessageIds } });

        console.log("Mensagens mencionadas: ", mentionedMessages);

        // Mapeamento das mensagens mencionadas por ID para facilitar o acesso
        const mentionedMessagesMap = mentionedMessages.reduce((map, msg) => {
            map[msg._id] = msg;
            return map;
        }, {});

        const formattedMessages = await Promise.all(
            messages.map(async message => {
                if (message.mentionedMessageId && mentionedMessagesMap[message.mentionedMessageId]) {
                    const mentionedMsg = mentionedMessagesMap[message.mentionedMessageId];

                    const senderName = await getSenderName(mentionedMsg.sender, mentionedMsg.senderType);

                    message.mentionedMessage = {
                        _id: mentionedMsg._id,
                        senderName,
                        senderId: mentionedMsg.sender,
                        senderType: mentionedMsg.senderType,
                        content: mentionedMsg.content,
                        hasAudio: !!mentionedMsg.audioUrl && mentionedMsg.audioUrl !== ""
                    };
                }
                return message;
            })
        );

        console.log("###### Mensagens formatadas ####### ");

        return formattedMessages;
    } catch (error) {
        console.error("Erro ao formatar mensagens mencionadas: ", error);
        return messages;
    }
};

module.exports = { 
    getInitialChatData, 
    formatMessagesContainingMentionedMessages 
};