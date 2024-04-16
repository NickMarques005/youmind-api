const notificationModel = require('../../models/notification');
const users = require('../../models/users');
const firebase_service = require('../../firebase/firebase_service');
const notificationService = require('../../services/notificationService');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');

exports.registerPushNotification = async (req, res) => {
    console.log("Register PushNotification!");

    try {
        const { push_token, userId } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        const token = String(push_token);
        const existingToken = await firebase_service.getToken(userId);

        console.log("EXISTING TOKEN: ", existingToken);

        if (Object.keys(existingToken).length !== 0) {
            return HandleSuccess(res, 200, "Push Token já registrado");
        }

        await firebase_service.saveToken(userId, token);

        return HandleSuccess(res, 200, "Push Token registrado com sucesso");
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return HandleError(res, 500, "Erro ao registrar Push Token");
    }
}

exports.notifyTreatmentSolicitation = async (req, res) => {
    try {
        const { userId } = req.user;
        const { destinatary_user_email, destinatary_user_type } = req.body;
        
        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        if (destinatary_user_type === "patient") {
            console.log("PATIENT: ", destinatary_user_email);
            const destinatary_user = await PatientUser.findOne({
                email: destinatary_user_email
            }, { _id: 1, name: 1 });

            const sender_user = await DoctorUser.findOne({
                _id: userId
            }, { name: 1, email: 1 });

            if (!sender_user || !destinatary_user) {
                return HandleError(res, 404, "Usuário não encontrado. Envie a solicitação novamente");
            }

            const destinatary_id = destinatary_user._id;
            const { token } = await firebase_service.getToken(destinatary_id);

            if (!token) {
                return HandleError(res, 400, "Usuário destinatário não possui registro para notificação");
            }

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

            return HandleError(res, 200, `Solicitação enviada para ${destinatary_user.name}`);
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
                return HandleError(res, 400, "Usuário não encontrado. Envie a solicitação novamente");
            }

            console.log("ID: ", destinatary_user._id);
            console.log("USER ID: ", sender_user._id);

            const { token } = await firebase_service.getToken(destinatary_user._id);

            if (!token) {
                return HandleError(res, 400, "Usuário destinatário não possui registro para notificação");
            }

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

            return HandleSuccess(res, 200, `Solicitação enviada para ${destinatary_user.name}`);
        }
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return HandleError(res, 500, "Erro em registrar Push Notification");
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
        return console.log("Notificação enviada: ", receips);
    }
    catch (err) {
        console.error("Houve um erro ao enviar a notificação ao usuário: ", err);
        return;
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

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        console.log("Usuário que busca as notificações: ", userId);

        const notifications = await notificationModel.find({ user: userId }).sort({ createdAt: -1 });
        return HandleSuccess(res, 200, "Busca de notificações feita com sucesso", notifications);
    }
    catch (err) {
        console.error("Erro ao buscar notificações: ", err);
        return HandleError(res, 500, "Erro ao buscar notificações");
    }
};

exports.deleteNotification = async (req, res) => {

    try {
        const { notificationId } = req.body;
        const { userId } = req.user;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        const deletedNotification = await notificationModel.findOneAndDelete({
            _id: notificationId,
            user: userId,
        });

        if (!deletedNotification) return HandleError(res, 404, "Notificação não encontrada");

        return HandleSuccess(res, 200, "Notificação excluída com sucesso", { notificationId: deletedNotification._id});
    }
    catch (err) {
        console.error("Erro ao deletar notificação: ", err);
        return HandleError(res, 500, "Erro ao deletar notificação");
    }
};

exports.updateNotification = async (req, res) => {

    try {
        const { userId, notificationId, updatedNotification } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        const NotificationToUpdate = await notificationModel.findOneAndUpdate({
            _id: notificationId,
            user: userId,
        },
            { $set: updatedNotification },
            { new: true }
        );

        if (!NotificationToUpdate) return HandleError(res, 404, "Notificação não encontrada");

        return HandleSuccess(res, 200, "Notificação atualizada com sucesso");
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return HandleError(res, 500, "Erro ao criar notificação");
    }
};

