const notificationModel = require('../models/notification');
const users = require('../models/users');
const firebase_service = require('../firebase/firebase_service');
const notificationService = require('../services/notificationService');

exports.registerPushNotification = async (req, res) => {
    console.log("Register PushNotification!");

    try {
        const { push_token, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const token = String(push_token);

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
}

exports.notifyTreatmentSolicitation = async (req, res) => {
    try {

        const { destinatary_user_email, destinatary_user_type, userId } = req.body;
        
        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

        if (destinatary_user_type == "patient") {
            console.log("PATIENT: ", destinatary_user_email);
            const destinatary_user = await patient_model.findOne({
                email: destinatary_user_email
            }, { _id: 1, name: 1 });

            const sender_user = await doctor_model.findOne({
                _id: userId
            }, { name: 1, email: 1 });

            if (!sender_user || !destinatary_user) {
                return res.status(400).json({ success: false, errors: ["Paciente não encontrado"] });
            }

            console.log("ID: ", destinatary_user._id);

            const destinatary_id = destinatary_user._id;

            const { token } = await firebase_service.getToken(destinatary_id);

            if (!token) {
                return res.status(400).json({ success: false, errors: ["Usuário destinatário não possui registro para notificação"] });
            }

            console.log("SEND PUSH NOTIFICATION!!!", token);

            const notificationData = {
                title: `Solicitação para tratamento`,
                body: `O especialista ${sender_user.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
                data: {
                    notify_type: 'treatment',
                    notify_function: 'solicitation',
                    buttons: {
                        button_accept: "Aceitar",
                        button_decline: "Recusar"
                    },
                    sender_params: {
                        email: sender_user.email
                    },
                    show_modal: true,
                },
            };

            await notificationService.sendPushNotificationAndSave(notificationData, token, destinatary_id);

            return res.status(200).json({ success: true, message: `Solicitação enviada para ${destinatary_user.name}` });
        }
        else {
            console.log("DOCTOR: ", destinatary_user_email);

            const destinatary_user = await doctor_model.findOne({
                email: destinatary_user_email
            }, { _id: 1, name: 1 });

            const sender_user = await patient_model.findOne({
                _id: userId
            }, { name: 1, email: 1 });

            if (!destinatary_user || !sender_user) {
                return res.status(400).json({ success: false, errors: ["Paciente não encontrado"] });
            }

            console.log("ID: ", destinatary_user._id);
            console.log("USER ID: ", sender_user._id);

            const { token } = await firebase_service.getToken(destinatary_user._id);

            if (!token) {
                return res.status(400).json({ success: false, errors: ["Usuário destinatário não possui registro para notificação"] });
            }

            console.log("SEND PUSH NOTIFICATION!!!", token);

            const notificationData = {
                title: `Solicitação para tratamento`,
                body: `O paciente ${sender_user.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
                data: {
                    notify_type: 'treatment',
                    notify_function: 'solicitation',
                    buttons: {
                        button_accept: "Aceitar",
                        button_decline: "Recusar"
                    },
                    sender_params: {
                        email: sender_user.email
                    },
                    show_modal: true,
                }
            };

            await notificationService.sendPushNotificationAndSave(notificationData, token, destinatary_user._id);


            return res.status(200).json({ success: true, message: `Solicitação enviada para ${destinatary_user.name}` });
        }
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return res.status(500).json({ success: false, errors: ["Houve um erro no servidor"] });
    }
}

exports.sendNotification = async (notification, _id, pushToken) => {
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();
    console.log("Notification Data: ", notification, " // pushToken: ", pushToken, " // message Id: ", _id);
    try {
        const notificationToSend = {
            to: pushToken,
            title: notification.title,
            body: notification.body,
            data: { ...notification.data, _id }
        }

        let receipts = await expo.sendPushNotificationsAsync([notificationToSend]);
        console.log(receipts);

        return console.log("Notificação enviada!!!");
    }
    catch (err) {
        return console.error("Houve um erro ao enviar a notificação ao usuário: ", err);
    }
}

exports.createNotification = async (notificationData, userId) => {
    console.log("NOTIFICATION CREATION IN DB....");
    if (!userId) {
        console.log("Houve um erro! Usuário não fornecido");
        return console.log("Usuário não encontrado");
    }

    try {

        const newNotification = new notificationModel({
            user: userId,
            title: notificationData.title,
            body: notificationData.body,
            data: notificationData.data,
        });

        const savedNotification = await newNotification.save();

        if (!savedNotification) {
            return console.log("Houve um erro ao salvar a notificação!");
        }

        console.log("Notificação criada com sucesso")

        return savedNotification._id;
    }
    catch (err) {
        return console.error("Erro ao criar notificação: ", err);
    }
};

exports.getNotifications = async (req, res) => {

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        console.log("Usuário que busca as notificações: ", userId);

        const notifications = await notificationModel.find({ user: userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: notifications });
    }
    catch (err) {
        console.error("Erro ao buscar notificações: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.deleteNotification = async (req, res) => {

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const notificationId = req.body.notificationId;
        const deletedNotification = await notificationModel.findOneAndDelete({
            _id: notificationId,
            user: userId,
        });

        if (!deletedNotification) {
            return res.status(404).json({ success: false, errors: ["Notificação não encontrada"] });
        }

        return res.status(200).json({ success: true, message: "Notificação excluída com sucesso!" });

    }
    catch (err) {
        console.error("Erro ao deletar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.updateNotification = async (req, res) => {

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const notificationId = req.body.notificationId;
        const updatedData = req.body.notificationUpdate;

        const updatedNotification = await notificationModel.findOneAndUpdate({
            _id: notificationId,
            user: userId,
        },
            { $set: updatedData },
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({ success: false, errors: ["Notificação não encontrada"] });
        }

        return res.status(200).json({ success: true, data: updatedNotification, message: "Mensagem atualizada com sucesso!" });
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

