const notificationService = require('../../../../services/notifications/notificationService');
const { findSender, handleSenderIcon } = require('../../../../utils/chat/chat');
const Treatment = require('../../../../models/treatment');
const { ScreenTypes, MenuTypes } = require('../../../../utils/app/screenMenuTypes');
const { getInitialChatData, emitInitialChatUpdate } = require('../../../../services/chat/chatServices');

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

            await emitInitialChatUpdate(io, senderId, { chat: updatedInitialChatSender, treatmentId }, "updateInitialChat");
            await emitInitialChatUpdate(io, receiverId, { chat: updatedInitialChatReceiver, treatmentId }, "updateInitialChat");

            const notificationData = {
                title: `${senderMessage.type === 'doctor' ? 'Dr. ' : ''}${senderMessage.name}`,
                body: `${newMessage.content}`,
                data: {
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
                },
            };

            console.log(notificationData);

            const notificationsService = await notificationService.sendNotificationToAllDevices(receiverId, notificationData);
            console.log("Notificação mandada: ", notificationsService);
        }
    }
}

module.exports = handleInsertMessage;