const notificationService = require('../../../../services/notifications/notificationService');
const { findSender } = require('../../../../utils/chat/chat');
const Treatment = require('../../../../models/treatment');
const { ScreenTypes, MenuTypes } = require('../../../../utils/app/screenMenuTypes');

const handleInsertMessage = async (change) => {
    const newMessage = change.fullDocument;
    const senderId = newMessage.sender;
    const conversation = newMessage.conversationId;
    const associatedTreatment = await Treatment.findById(conversation);

    console.log("ASSOCIATED TREATMENT", associatedTreatment);

    if (associatedTreatment) {
        const otherUserId = associatedTreatment.patientId === senderId ? associatedTreatment.doctorId : associatedTreatment.patientId;
        console.log(otherUserId);

        if (otherUserId !== senderId) {
            console.log("Send to: ", otherUserId);

            const senderMessage = await findSender(senderId);

            if (!senderMessage) {
                console.log("senderId not found");
                return;
            }

            console.log(senderMessage);

            const notificationData = {
                title: `${senderMessage.type === 'doctor' ? 'Dr. ' : ''}${senderMessage.name}`,
                body: `${updatedMessage.content}`,
                data: {
                    notify_type: 'chat',
                    notify_function: 'message_alert',
                    sender_params: {
                        name: senderMessage.name,
                        email: senderMessage.email,
                        id: senderId,
                        avatar: senderMessage.avatar
                    },
                    show_modal: false,
                    redirect_params: {
                        screen: ScreenTypes.CHAT,
                        menu_option: MenuTypes.TRATAMENTO
                    }
                },
                icon: senderMessage.avatar
            };

            console.log(notificationData);

            const notificationsService = await notificationService.sendNotificationToAllDevices(otherUserId, notificationData);
            console.log("Notificação mandada: ", notificationsService);
        }
    }
}

module.exports = handleInsertMessage;