//---changeStreams.js---//

const notificationService = require('../functions/notificationService');
const treatment = require('../models/treatment');
const message = require('../models/message');
const { Expo } = require('expo-server-sdk');
const firebase_service = require('../firebase/firebase_service');
const users = require('../models/users');

const expo = new Expo;


const findSender = async (senderIdId) => {
    const patient_model = users.PatientUser;
    const doctor_model = users.DoctorUser;

    const patientUser = await patient_model.findById(senderIdId);
    if (patientUser) {
        const patientMessage = {
            name: patientUser.name,
            email: patientUser.email,
            type: patientUser.type
        }

        return patientMessage;
    }

    const doctorUser = await doctor_model.findById(senderIdId);
    if (doctorUser) {
        const doctorMessage = {
            name: doctorUser.name,
            email: doctorUser.email,
            type: doctorUser.type
        }

        return doctorMessage
    }

    return null;
}

const initializeChangeStream = async (io) => {

    const treatmentChangeStream = treatment.watch();
    const messageChangeStream = message.watch();

    treatmentChangeStream.on('change', async (change) => {
        console.log("Treatment Change Stream Event: ", change);

        if (change.ns.coll === 'treatment_data') {
            if (change.operationType === 'insert') {
                const updatedTreatment = change.fullDocument;
                const patientId = updatedTreatment.patientId;
                const doctorId = updatedTreatment.doctorId;

                console.log("DATA FROM CHANGE STREAM: ", patientId, doctorId);

                io.to(patientId).emit(patientId, { treatmentId: updatedTreatment._id })
                io.to(doctorId).emit(doctorId, { treatmentId: updatedTreatment._id });
            }
            else if (change.operationType === 'delete') {
                console.log("TRATAMENTO DELETADO!");
                const treatmentId = change.documentKey._id.toString();
                console.log(treatmentId);

                io.to(treatmentId).emit(treatmentId, { data: treatmentId });
            }
        }
    });

    messageChangeStream.on('change', async (change) => {
        console.log("Message Change Stream Event: ", change);

        if (change.ns.coll == 'message_data') {
            if (change.operationType === 'insert') {
                const updatedMessage = change.fullDocument;
                const senderId = updatedMessage.sender;
                const conversation = updatedMessage.conversationId;

                const associatedTreatment = await treatment.findOne({
                    $or: [{ patientId: senderId }, { doctorId: senderId }],
                    _id: conversation
                });

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

                        const { token } = await firebase_service.getToken(otherUserId);

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
    })
}

module.exports = { initializeChangeStream };

