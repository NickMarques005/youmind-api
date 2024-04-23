const notificationModel = require('../../models/notification');
const { PatientUser, DoctorUser} = require('../../models/users');
const { getTokenFromFirebase, saveTokenOnFirebase} = require('../../firebase/push_notification/push_notification');
const notificationService = require('../../services/notificationService');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');
const MessageTypes = require('../../utils/typeResponse');

exports.registerPushNotification = async (req, res) => {
    try {
        const { push_token, userId } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        const token = String(push_token);
        const existingToken = await getTokenFromFirebase(userId);

        console.log("EXISTING TOKEN: ", existingToken);

        if (existingToken && Object.keys(existingToken).length !== 0) {
            return HandleSuccess(res, 200, "Push Token já registrado");
        }

        await saveTokenOnFirebase(userId, token);

        return HandleSuccess(res, 200, "Push Token registrado com sucesso");
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return HandleError(res, 500, "Erro ao registrar Push Token");
    }
}

exports.notifyTreatmentSolicitation = async (req, res) => {
    const { userId } = req.user;
    const { destinatary_user_email, destinatary_user_type } = req.body;

    if (!userId) return HandleError(res, 401, "Usuário não autorizado");

    const User = destinatary_user_type === "patient" ? PatientUser : DoctorUser;
    const otherTypeUser = destinatary_user_type === "patient" ? DoctorUser : PatientUser;

    try {
        const destinatary_user = await User.findOne({ email: destinatary_user_email }, '_id name');
        const sender_user = await otherTypeUser.findById(userId, 'name email');

        if (!sender_user || !destinatary_user) {
            return HandleError(res, 404, "Usuário não encontrado. Envie a solicitação novamente");
        }

        const token = await getTokenFromFirebase(destinatary_user._id);

        if (!token) {
            return HandleError(res, 400, "Usuário destinatário não possui registro para notificação");
        }

        const notificationData = {
            title: `Solicitação para tratamento`,
            body: `O ${destinatary_user_type === "patient" ? "especialista" : "paciente"} ${sender_user.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
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
    } catch (err) {
        return HandleError(res, 500, "Erro em registrar Push Notification", err);
    }
}

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

