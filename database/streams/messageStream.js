const message = require('../../models/message');
const notificationService = require('../../services/notificationService');
const { getTokenFromFirebase } = require('../../firebase/push_notification/push_notification');
const { findSender } = require('../../utils/chat');

const handleMessageChange = async (io, change) => {
    console.log("Message Change Stream Event: ", change);

    if (change.operationType === 'insert') {
        const updatedMessage = change.fullDocument;
        const senderId = updatedMessage.sender;
        const conversation = updatedMessage.conversationId;

        console.log("ASSOCIATED TREATMENT", associatedTreatment);

        if (associatedTreatment) {
            const otherUserId = associatedTreatment.patientId === senderId ? associatedTreatment.doctorId : associatedTreatment.patientId;

            if (otherUserId !== senderId) {
                console.log("Send to: ", otherUserId);

                const senderMessage = await findSender(senderId);

                if (!senderMessage) {
                    console.log("senderId not found");
                    return;
                }

                const { token } = await getTokenFromFirebase(otherUserId);

                if (!token) {
                    return;
                }

                console.log("PUSH NOTIFICATION MESSAGE! ", token);

                const notificationData = {
                    title: senderMessage.type === 'doctor' ? `Dr. ${senderMessage.name}` : `${senderMessage.name}`,
                    body: `${updatedMessage.content}`,
                    data: {
                        notify_type: 'chat',
                        notify_function: 'message_alert',
                        sender_params: {
                            name: senderMessage.name,
                            email: senderMessage.email,
                            id: senderId
                        },
                        show_modal: false,
                        redirect_params: {
                            screen: 'treatmentChat',
                            menu_option: 'treatmentScreen'
                        }
                    },
                };

                await notificationService.sendPushNotificationAndSave(notificationData, token, otherUserId);
            }
        }
    }
}

const messageStream = (io) => {
    const messageChangeStream = message.watch();
    messageChangeStream.on('change', change => handleMessageChange(io, change));
}

module.exports = messageStream;