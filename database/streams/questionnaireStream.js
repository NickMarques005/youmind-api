const { PatientUser } = require('../../models/users');
const Questionnaire = require('../../models/questionnaire');
const notificationService = require('../../services/notificationService');
const { ScreenTypes, MenuTypes, PageTypes } = require('../../utils/app/screenMenuTypes');
const MessageTypes = require('../../utils/response/typeResponse');

const handleQuestionnaireChange = async (io, change) => {
    console.log("Questionnaire Change Stream Event: ", change)

    if (change.operationType === 'insert') {
        const newQuestionnaire = change.fullDocument;
        const patientId = newQuestionnaire.patientId;

        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.error(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const notificationData = {
            title: 'Novo Questionário Disponível!',
            body: `Olá ${(patient.name).split(' ')[0]}! Você tem um novo questionário para responder. `,
            data: {
                notify_type: 'treatment',
                notify_function: 'questionnaire_alert',
                show_modal: false,
                redirect_params: {
                    screen: ScreenTypes.HEALTH_QUESTIONNAIRES,
                    menu_option: MenuTypes.SAÚDE,
                    page: PageTypes.SAÚDE.QUESTIONARIOS
                },
            },
            icon: MessageTypes.QUESTIONNAIRE
        };

        const notificationSended = await notificationService.sendNotificationToAllDevices(patientId, notificationData);
        if(!notificationSended) return;

        const questionnaireItem = {
            currentQuestionnaire: newQuestionnaire
        };
        
        io.to(patientId).emit('newQuestionnaire', questionnaireItem);
        console.log(`Notificação enviada para o paciente ${patientId}`);
    }
    else if(change.operationType === 'update')
    {

    }
};

const questionnaireStream = (io) => {
    const changeStream = Questionnaire.watch();
    changeStream.on('change', change => handleQuestionnaireChange(io, change));
};

module.exports = questionnaireStream;