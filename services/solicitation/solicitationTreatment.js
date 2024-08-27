const TreatmentRequest = require("../../models/solicitation_treatment");
const Treatment = require("../../models/treatment");
const notificationService = require('../../services/notifications/notificationService');
const { HandleError, HandleSuccess } = require("../../utils/response/handleResponse");
const MessageTypes = require("../../utils/response/typeResponse");
const NotificationStructure = require("../notifications/notificationStructure");

const handleTreatmentSolicitation = async ({
    req,
    res,
    requester,
    receiver,
    fieldRequesterId,
    fieldReceiverId,
    solicitationType
}) => {

    const existingRequest = await TreatmentRequest.findOne({
        [fieldRequesterId]: requester.uid,
        [fieldReceiverId]: receiver.uid,
    });

    if (existingRequest) {
        return HandleError(res, 400, `A solicitação já foi mandada para ${receiver.gender === 'Feminino' ? 'a' : 'o'} ${receiver.name}!`);
    }

    const existingTreatment = await Treatment.findOne({
        [fieldRequesterId]: requester.uid,
        doctorId: { $ne: undefined }
    });

    if (existingTreatment) {
        if (existingTreatment.doctorId !== receiver.uid) {
            return HandleError(res, 400, `O paciente já está em tratamento com outro doutor!`);
        } else {
            return HandleError(res, 400, "Já existe um tratamento ativo entre você e este usuário");
        }
    }

    const treatmentRequest = new TreatmentRequest({
        [fieldRequesterId]: requester.uid,
        [fieldReceiverId]: receiver.uid,
    });

    await treatmentRequest.save();

    /*
    ### Criação e envio da notificação
    */
    const notificationData = new NotificationStructure(
        'Solicitação para tratamento',
        `${requester.gender === 'Feminino' ? 'A' : 'O'} ${receiver.type === "patient" ? "especialista" : "paciente"} ${requester.name} enviou uma solicitação para inicializar tratamento. Deseja aceitar a solicitação?`,
        {
            notify_type: 'treatment',
            notify_function: 'solicitation',
            buttons: {
                button_accept: "Aceitar",
                button_decline: "Recusar"
            },
            solicitation_params: {
                email: requester.email,
                avatar: requester.avatar,
                type: requester.type,
                solicitationId: treatmentRequest._id.toString(),
                solicitationType: solicitationType
            },
            show_modal: true,
            has_decline: true,
            icon: MessageTypes.TREATMENT
        }
    );

    const notificationSent = await notificationData.sendToUser(receiver.uid);
    if (!notificationSent) {
        return HandleError(res, 400, "Erro ao enviar a notificação");
    }

    return HandleSuccess(res, 200, `Solicitação enviada para ${receiver.name}`, undefined, MessageTypes.SUCCESS);
};

module.exports = { handleTreatmentSolicitation }