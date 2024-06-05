const { receiveMessages, deleteMessage } = require('../../services/sqs_service');
const { medicationsQueueUrl } = require('../sqs_queues');
const { PatientUser } = require('../../../models/users');
const { updateMedicationHistoryToAlert } = require('../../../services/medicationService');

const processMedicationMessage = async (message) => {
    const { patientId, medicationHistoryId } = JSON.parse(message.Body);

    try {
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.log(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const medicationUpdated = await updateMedicationHistoryToAlert(medicationHistoryId);

        if(medicationUpdated)
        {
            console.log(`Medicação processada e enviada para o paciente ${patientId}`);
        }
        
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
};

const consumeMedicationMessages = async () => {
    while (true) {
        const messages = await receiveMessages(medicationsQueueUrl);
        for (const message of messages) {
            await processMedicationMessage(message);
            await deleteMessage(medicationsQueueUrl, message.ReceiptHandle);
        }
    }
};

module.exports = consumeMedicationMessages;