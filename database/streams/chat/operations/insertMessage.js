const { findSender, handleSenderIcon } = require('../../../../utils/chat/chat');
const Treatment = require('../../../../models/treatment');
const { ScreenTypes, MenuTypes } = require('../../../../utils/app/screenMenuTypes');
const { getInitialChatData } = require('../../../../services/chat/chatServices');
const NotificationStructure = require('../../../../services/notifications/notificationStructure');
const { emitInitialChatUpdate } = require('../../../../socket/events/chatEvents');

const handleInsertMessage = async (change, io) => {
    const newMessage = change.fullDocument;
    const senderId = newMessage.sender;
    const conversation = newMessage.conversationId;
    const associatedTreatment = await Treatment.findById(conversation);

    console.log("ASSOCIATED TREATMENT", associatedTreatment);

    if (associatedTreatment) {
        const receiverId = associatedTreatment.patientId === senderId ? associatedTreatment.doctorId : associatedTreatment.patientId;
        console.log("Suposto outro usuário: ", receiverId);

        if (receiverId !== senderId) {
            const treatmentId = associatedTreatment._id;
            console.log("Send to: ", receiverId);

            const senderMessage = await findSender(senderId);

            if (!senderMessage) {
                console.log("senderId not found");
                return;
            }

            console.log(senderMessage);

            const senderIcon = senderMessage.avatar || handleSenderIcon(senderMessage.type);

            const updatedInitialChatSender = await getInitialChatData(treatmentId, senderId);
            const updatedInitialChatReceiver = await getInitialChatData(treatmentId, receiverId);

            await emitInitialChatUpdate({ io, userId: senderId, updatedChat: { chat: updatedInitialChatSender, treatmentId } });
            await emitInitialChatUpdate({ io, userId: receiverId, updatedChat: { chat: updatedInitialChatReceiver, treatmentId } });

            const notificationData = new NotificationStructure(
                `${senderMessage.type === 'doctor' ? 'Dr. ' : ''}${senderMessage.name}`,
                `${newMessage.content}`,
                {
                    notify_type: 'chat',
                    notify_function: 'message_alert',
                    sender_params: {
                        name: senderMessage.name,
                        email: senderMessage.email,
                        _id: associatedTreatment._id,
                        avatar: senderMessage.avatar || '',
                        type: senderMessage.type,
                        uid: senderId,
                        birth: senderMessage.birth,
                        gender: senderMessage.gender
                    },
                    show_modal: false,
                    redirect_params: {
                        screen: ScreenTypes.CHAT,
                        menu_option: MenuTypes.TRATAMENTO
                    },
                    icon: senderIcon
                }
            );

            const notificationSent = await notificationData.sendToUser(receiverId);
            console.log("Notificação enviada: ", notificationSent);
        }
    }
}

module.exports = handleInsertMessage;