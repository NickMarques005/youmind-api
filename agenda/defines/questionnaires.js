const { PatientUser } = require('../../models/users');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const Questionnaire = require('../../models/questionnaire');
const { sendMessage } = require('../../aws/services/sqs_service');
const { questionnairesQueueUrl } = require('../../aws/sqs/sqs_queues');
const { PatientQuestionnaireHistory } = require('../../models/patient_history');
const { getCurrentDateInBrazilTime, convertToBrazilTime } = require('../../utils/date/timeZones');

const sendDailyQuestionnaires = async job => {
    console.log("\nIniciando tarefa de envio de questionário diário...");

    try {
        console.log("Atualização PatientHistory questionários não respondidos...");
        const questionnaireHistories = await PatientQuestionnaireHistory.updateMany(
            { 'questionnaire.pending': true },
            { $set: { 'questionnaire.pending': false, 'questionnaire.answered': false } }
        );

        if(questionnaireHistories) console.log("Historicos atualizados!");

        const patients = await PatientUser.find({ is_treatment_running: true });

        const template = await QuestionnaireTemplate.findOne({});
        if (!template) {
            console.log('Nenhum template de questionário encontrado.');
            return;
        }

        const today = getCurrentDateInBrazilTime();
        today.setHours(0, 0, 0, 0);

        for (const patient of patients) {
            if (!patient.uid) {
                console.log(`Paciente sem UID: ${patient._id}`);
                continue;
            }

            const lastQuestionnaire = await Questionnaire.findOne({
                patientId: patient.uid
            }).sort({ createdAt: -1 });

            if (lastQuestionnaire) {
                const lastSentDay = convertToBrazilTime(lastQuestionnaire.createdAt);
                lastSentDay.setHours(0, 0, 0, 0);

                if (lastSentDay.getTime() === today.getTime()) {
                    console.log(`Questionário já enviado para o paciente ${patient._id} hoje.`);
                    continue;
                }
            }

            const messageBody = {
                patientId: patient.uid,
                questionnaireTemplateId: template._id
            };

            await sendMessage(questionnairesQueueUrl, messageBody);
        }

        console.log("Mensagens enviadas para a fila SQS Questionnaires!");
    }
    catch (err) {
        console.error('Erro ao enviar questionários:', error);
    }
}

module.exports = { sendDailyQuestionnaires };