const { PatientUser } = require('../../models/users');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const Questionnaire = require('../../models/questionnaire');
const { sendMessage } = require('../../aws/services/sqs_service');
const { questionnairesQueueUrl } = require('../../aws/sqs/sqs_queues');
const { PatientQuestionnaireHistory } = require('../../models/patient_history');
const { getCurrentDateInBrazilTime, convertDateToBrazilDate } = require('../../utils/date/timeZones');

const sendDailyQuestionnaires = async (timeSlot) => {
    console.log(`Iniciando tarefa de envio de questionário diário (${timeSlot})...`);

    try {
        // Atualiza históricos de questionários não respondidos no horário especifico de timeSlot
        await PatientQuestionnaireHistory.updateMany(
            { 'questionnaire.pending': true },
            { $set: { 'questionnaire.pending': false, 'questionnaire.answered': false } }
        );

        const patients = await PatientUser.find({ is_treatment_running: true });
        if (patients.length === 0) return console.log("Nenhum usuário para mandar questionário");

        // Mandar template especifico para matutino ou noturno dependendo do timeSlot
        const template = await QuestionnaireTemplate.findOne({ time: timeSlot });
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

            // Verifica se o questionário para o horário já foi enviado
            const lastQuestionnaire = await Questionnaire.findOne({
                patientId: patient.uid,
                name: { $regex: timeSlot, $options: 'i' } // Nome contém "matutino" ou "noturno"
            }).sort({ createdAt: -1 });

            if (lastQuestionnaire) {
                const lastSentDay = convertDateToBrazilDate(lastQuestionnaire.createdAt);
                lastSentDay.setHours(0, 0, 0, 0);

                if (lastSentDay.getTime() === today.getTime()) {
                    console.log(`Questionário (${timeSlot}) já enviado para o paciente ${patient._id} hoje.`);
                    continue;
                }
            }

            const messageBody = {
                patientId: patient.uid,
                questionnaireTemplateId: template._id,
                timeSlot
            };

            await sendMessage(questionnairesQueueUrl, messageBody);
        }

        console.log("Mensagens enviadas para a fila SQS Questionnaires!");
    } catch (error) {
        console.error('Erro ao enviar questionários:', error);
    }
};

const sendDailyQuestionnairesMorning = async () => {
    await sendDailyQuestionnaires('matutino');
};

const sendDailyQuestionnairesEvening = async () => {
    await sendDailyQuestionnaires('noturno');
};

module.exports = { sendDailyQuestionnairesMorning, sendDailyQuestionnairesEvening };