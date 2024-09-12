const { PatientUser } = require("../../models/users");
const { emitNewQuestionnaire } = require("../../socket/events/questionnaireEvents");
const { ScreenTypes, MenuTypes, PageTypes } = require("../../utils/app/screenMenuTypes");
const { MessageTypes } = require("../../utils/response/typeResponse");
const NotificationStructure = require("../notifications/notificationStructure");

const sendNewQuestionnaireToPatient = async (newQuestionnaire, patientId) => {
    const patient = await PatientUser.findOne({ uid: patientId });

    const firstName = patient.name.split(' ')[0];
    const notificationData = new NotificationStructure(
        'Novo Questionário Disponível!',
        `Olá ${firstName}! Você tem um novo questionário para responder.`,
        {
            notify_type: 'treatment',
            notify_function: 'questionnaire_alert',
            show_modal: false,
            redirect_params: {
                screen: ScreenTypes.HEALTH_QUESTIONNAIRES,
                menu_option: MenuTypes.SAÚDE,
                page: PageTypes.SAÚDE.QUESTIONARIOS
            },
            icon: MessageTypes.QUESTIONNAIRE
        }
    );

    const questionnaireData = {
        currentQuestionnaire: newQuestionnaire
    }

    await emitNewQuestionnaire(patientId, questionnaireData);

    const notificationSended = await notificationData.sendToPatient(patientId);
    if (!notificationSended) {
        console.log("Notificação do novo questionário não enviada");
    }
    
    return notificationSended;
}

module.exports = { sendNewQuestionnaireToPatient }