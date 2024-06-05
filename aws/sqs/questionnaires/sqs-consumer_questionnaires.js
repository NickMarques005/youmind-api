const { receiveMessages, deleteMessage } = require('../../services/sqs_service');
const { questionnairesQueueUrl } = require('../sqs_queues');
const { PatientUser } = require('../../../models/users');
const { createNewQuestionnaire } = require('../../../services/questionnaireService');

const processQuestionnaireMessage = async (message) => {
    console.log(message);
    const { patientId, questionnaireTemplateId } = JSON.parse(message.Body);

    if (!patientId || !questionnaireTemplateId) {
        console.error('Mensagem inválida recebida:', message.Body);
        return;
    }

    try {
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.log(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const questionnaire = await createNewQuestionnaire(patientId, questionnaireTemplateId);

        if (questionnaire) {
            console.log(`Questionário criado e notificação enviada para o paciente ${patientId}`);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
};

const consumeQuestionnaireMessages = async () => {
    while (true) {
        const messages = await receiveMessages(questionnairesQueueUrl);
        for (const message of messages) {
            await processQuestionnaireMessage(message);
            await deleteMessage(questionnairesQueueUrl, message.ReceiptHandle);
        }
    }
};

module.exports = consumeQuestionnaireMessages;


