const { PatientUser } = require('../../../../models/users');
const notificationService = require('../../../../services/notifications/notificationService');
const { emitNewQuestionnaire } = require('../../../../services/questionnaires/questionnaireService');
const { ScreenTypes, MenuTypes, PageTypes } = require('../../../../utils/app/screenMenuTypes');
const MessageTypes = require('../../../../utils/response/typeResponse');

const handleInsertQuestionnaire = async (change, io) => {
    const newQuestionnaire = change.fullDocument;
    const patientId = newQuestionnaire.patientId;

    const patient = await PatientUser.findOne({ uid: patientId });
    if (!patient) {
        console.error(`Paciente não encontrado: ${patientId}`);
        return;
    }

    const notificationData = {
        title: 'Novo Questionário Disponível!',
        body: `Olá ${(patient.name).split(' ')[0]}! Você tem um novo questionário para responder.`,
        data: {
            notify_type: 'treatment',
            notify_function: 'questionnaire_alert',
            show_modal: false,
            redirect_params: {
                screen: ScreenTypes.HEALTH_QUESTIONNAIRES,
                menu_option: MenuTypes.SAÚDE,
                page: PageTypes.SAÚDE.QUESTIONARIOS
            },
            icon: MessageTypes.QUESTIONNAIRE
        },
    };

    const questionnaireData = {
        currentQuestionnaire: newQuestionnaire
    }

    await emitNewQuestionnaire(io, patientId, questionnaireData, "addNewQuestionnaire");

    const notificationSended = await notificationService.sendNotificationToAllDevices(patientId, notificationData);
    if(!notificationSended) console.log("Notificação do novo questionário não enviada");
};

module.exports = handleInsertQuestionnaire;