//----notifications_route.js----//

const notificationServive = require('../functions/notificationService');
const express = require('express');
const bodyparser = require('body-parser');
const router = express.Router();
const firebase_service = require('../firebase/firebase_service');
const notificationController = require('../controller/notificationController');

const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;
const users = require('../models/users');
const { Expo } = require('expo-server-sdk');

const expo = new Expo;

const jsonParser = bodyparser.json();
const httpParser = bodyparser.urlencoded({ extended: false });

//Register Push Notifications
router.post('/registerPushNotification', jsonParser, async (req, res) => {
    console.log("Register PushNotification!");
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;
        const token = String(req.body.push_token);

        console.log("USER ID: ", userId);

        const existingToken = await firebase_service.getToken(userId);

        console.log("EXISTING TOKEN: ", existingToken);

        if (Object.keys(existingToken).length !== 0) {
            return res.status(200).json({ success: true, message: "Token já está registrado" })
        }

        await firebase_service.saveToken(userId, token);

        return res.status(200).json({ success: true, message: "Token registrado com sucesso" });
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return res.status(500).json({ success: false });
    }
});

router.post('/notifyTreatmentSolicitation', async (req, res) => {

    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Não autorizado"] });
    }

    const { destinatary_user_email, destinatary_user_type } = req.body;
    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

        if (destinatary_user_type == "patient") {
            console.log("PATIENT: ", destinatary_user_email);
            const patient_user = await patient_model.findOne({
                email: destinatary_user_email
            }, { _id: 1, name: 1 });

            const doctor_user = await doctor_model.findOne({
                _id: userId
            }, { name: 1, email: 1 });

            if (!doctor_user || !patient_user) {
                return res.status(400).json({ success: false, errors: ["Paciente não encontrado"] });
            }

            console.log("ID: ", patient_user._id);

            const { token } = await firebase_service.getToken(patient_user._id);

            if (!token) {
                return res.status(400).json({ success: false, errors: ["Usuário destinatário não possui registro para notificação"] });
            }

            console.log("SEND PUSH NOTIFICATION!!!", token);

            const notificationData = {
                title: `Solicitação para tratamento`,
                body: `O especialista ${doctor_user.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
                data: {
                    notify_type: 'treatment',
                    notify_function: 'solicitation',
                    buttons: {
                        button_accept: "Aceitar",
                        button_decline: "Recusar"
                    },
                    sender: {
                        email: doctor_user.email
                    },
                    show_modal: true,
                },
            };

            await notificationServive.sendPushNotificationAndSave(notificationData, token);

            return res.status(200).json({ success: true, message: `Solicitação enviada para ${patient_user.name}` });
        }
        else {
            console.log("DOCTOR: ", destinatary_user_email);

            const doctor_user = await doctor_model.findOne({
                email: destinatary_user_email
            }, { _id: 1, name: 1 });

            const patient_user = await patient_model.findOne({
                _id: userId
            }, { name: 1, email: 1 });

            if (!doctor_user || !patient_user) {
                return res.status(400).json({ success: false, errors: ["Paciente não encontrado"] });
            }

            console.log("ID: ", doctor_user._id);
            console.log("USER ID: ", patient_user._id);

            const { token } = await firebase_service.getToken(doctor_user._id);

            if (!token) {
                return res.status(400).json({ success: false, errors: ["Usuário destinatário não possui registro para notificação"] });
            }

            console.log("SEND PUSH NOTIFICATION!!!", token);

            const notificationData = {
                title: `Solicitação para tratamento`,
                body: `O paciente ${patient_user.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
                data: {
                    notify_type: 'treatment',
                    notify_function: 'solicitation',
                    buttons: {
                        button_accept: "Aceitar",
                        button_decline: "Recusar"
                    },
                    sender: {
                        email: patient_user.email
                    },
                    show_modal: true,
                }
            };

            await notificationServive.sendPushNotificationAndSave(notificationData, token);
            

            return res.status(200).json({ success: true, message: `Solicitação enviada para ${doctor_user.name}` });
        }
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return res.status(500).json({ success: false, errors: ["Houve um erro no servidor"] });
    }
});

router.get('/getNotifications', notificationController.getNotifications);

router.delete('/deleteNotification', notificationController.deleteNotification);

router.put('/updateNotification', notificationController.updateNotification);

module.exports = router;