const { listQueues } = require('../services/sqs_service');
const consumeQuestionnaireMessages = require('../sqs/questionnaires/sqs-consumer_questionnaires');
const consumeMedicationMessages = require('../sqs/medications/sqs_consumer_medications');

const initializeSQS = async () => {
    
    const queues = await listQueues();
    console.log(`Filas SQS atuais:`);
    queues.forEach((queue, index) => console.log(`${index + 1}. ${queue}`));

    consumeQuestionnaireMessages();
    consumeMedicationMessages();
}

module.exports = initializeSQS;