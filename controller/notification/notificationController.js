const notificationModel = require('../../models/notification');
const Treatment = require('../../models/treatment');
const { PatientUser, DoctorUser } = require('../../models/users');
const { getTokenFromFirebase, saveTokenOnFirebase } = require('../../firebase/push_notification/push_notification');
const notificationService = require('../../services/notifications/notificationService');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const MessageTypes = require('../../utils/response/typeResponse');

exports.registerPushNotification = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!pushToken) return HandleError(res, 401, "Push token inválido");

        console.log("PUSH TOKEN: ", pushToken);
        const token = String(pushToken);

        console.log("TOKEN: ", token);
        const tokenKeysData = await getTokenFromFirebase(uid);

        console.log("EXISTING TOKEN: ", tokenKeysData);

        let user = await PatientUser.findOne({ uid: uid }) || await DoctorUser.findOne({ uid: uid });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        if (tokenKeysData) {
            for (const [key, value] of Object.entries(tokenKeysData)) {
                if (value.token === pushToken) {
                    return HandleSuccess(res, 200, "Push Token já registrado", { tokenKey: key });
                }
            }
        }

        const tokenKey = await saveTokenOnFirebase(user.uid, pushToken);
        if (tokenKey && !user.pushTokenKeys.includes(tokenKey)) {
            user.pushTokenKeys.push(tokenKey);
            await user.save();
            return HandleSuccess(res, 200, "Push Token registrado com sucesso", { tokenKey });
        } else {
            return HandleError(res, 500, "Falha ao registrar token no Firebase");
        }
    }
    catch (err) {
        console.error("Algo deu errado em registrar push Notification: ", err);
        return HandleError(res, 500, "Erro ao registrar Push Token");
    }
}

exports.createTreatmentSolicitation = async (req, res) => {
    const { uid } = req.user;
    const { receiver_email, type } = req.body;

    if (!uid) return HandleError(res, 401, "Usuário não autorizado");

    console.log(receiver_email);
    console.log(type);
    console.log(uid);

    const ModelRequester = type === "patient" ? PatientUser : DoctorUser;
    const ModelReceiver = type === "patient" ? DoctorUser : PatientUser;
    const fieldRequesterId = type === "patient" ? "patientId" : "doctorId";
    const fieldReceiverId = type === "patient" ? "doctorId" : "patientId";

    try {
        const [requester, receiver] = await Promise.all([
            ModelRequester.findOne({ uid: uid }),
            ModelReceiver.findOne({ email: receiver_email })
        ]);
        if (!requester) return HandleError(res, 404, "Seu usuário não foi encontrado em nosso banco de dados. Isso é um erro incomum. Se estiver com dificuldades de fazer solicitações de tratamento por causa desse erro, contate nosso suporte.");
        if (!receiver) return HandleError(res, 404, "Usuário não encontrado. Envie a solicitação novamente")

        const existingTreatment = await Treatment.findOne({
            [fieldRequesterId]: requester.uid,
            [fieldReceiverId]: receiver.uid
        });

        if (existingTreatment) {
            if (existingTreatment.status === "active") {
                return HandleError(res, 400, "Já existe um tratamento ativo entre você e este usuário");
            }
            else if (existingTreatment.status === "completed") {
                existingTreatment.status = "pending";
                await existingTreatment.save();
            }
        } else {
        
            const treatment = new Treatment({
                [fieldRequesterId]: requester.uid,
                [fieldReceiverId]: receiver.uid,
                status: "pending",
            });

            await treatment.save();
        }


        const notificationData = {
            title: `Solicitação para tratamento`,
            body: `${requester.gender && requester.gender === 'Feminino' ? 'A' : 'O'} ${receiver.type === "patient" ? "especialista" : "paciente"} ${requester.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
            data: {
                notify_type: 'treatment',
                notify_function: 'solicitation',
                buttons: {
                    button_accept: "Aceitar",
                    button_decline: "Recusar"
                },
                sender_params: {
                    email: requester.email,
                    avatar: requester.avatar
                },
                show_modal: true,
            },
            icon: MessageTypes.TREATMENT
        };

        const notificationsService = await notificationService.sendNotificationToAllDevices(receiver.uid, notificationData);
        if (!notificationsService.success) {
            return HandleError(res, 400, notificationsService.message);
        }

        return HandleSuccess(res, 200, `Solicitação enviada para ${receiver.name}`);
    } catch (err) {
        return HandleError(res, 500, "Erro em registrar Push Notification", err);
    }
}

exports.getNotifications = async (req, res) => {

    try {
        const { uid } = req.user;
        console.log("***Get notifications....");

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        console.log("Usuário que busca as notificações: ", uid);

        const limit = 20;
        const page = req.query.page || 1;
        const skip = (page - 1) * limit;

        const notifications = await notificationModel.find({ user: uid })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const deletedNotification = await notificationModel.findOneAndDelete({
            _id: notificationId,
            user: uid,
        });

        if (!deletedNotification) return HandleError(res, 404, "Notificação não encontrada");

        return HandleSuccess(res, 200, "Notificação excluída com sucesso", { notificationId: deletedNotification._id });
    }
    catch (err) {
        console.error("Erro ao deletar notificação: ", err);
        return HandleError(res, 500, "Erro ao deletar notificação");
    }
};

exports.deleteNotifications = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!notificationIds || notificationIds.length === 0) return HandleError(res, 400, "Notificações inválidas");

        const notificationsToDelete = await notificationModel.find({
            _id: { $in: notificationIds },
            user: uid
        });

        const foundIds = notificationsToDelete.map(notification => notification._id);

        const result = await notificationModel.deleteMany({
            _id: { $in: foundIds }
        });

        if (result.deletedCount === 0) return HandleError(res, 404, "Notificações não encontradas ou já excluídas");

        return HandleSuccess(res, 200, "Notificações excluídas com sucesso", { notificationIds: foundIds });

    } catch (err) {
        console.error("Erro ao deletar notificações: ", err);
        return HandleError(res, 500, `"Erro ao deletar notificações: ${err}`);
    }
}

exports.updateNotification = async (req, res) => {

    try {
        const { notificationId, updatedNotification } = req.body;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const NotificationToUpdate = await notificationModel.findOneAndUpdate({
            _id: notificationId,
            user: uid,
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