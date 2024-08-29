const { receiveMessages, deleteMessage } = require('../../services/sqs_service');
const { questionnairesQueueUrl } = require('../sqs_queues');
const { addNewQuestionnaire } = require('../../../services/questionnaires/addNewQuestionnaire');

const processQuestionnaireMessage = async (message) => {
    console.log(message);
    const { patientId, questionnaireTemplateId, timeSlot } = JSON.parse(message.Body);

    if (!patientId || !questionnaireTemplateId || !timeSlot) {
        console.error('Mensagem inválida recebida:', message.Body);
        return;
    }

    try {
        await addNewQuestionnaire(patientId, questionnaireTemplateId, timeSlot);
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


