const { PatientUser } = require('../../../../../models/users');
const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate } = require('../../../../../services/history/historyService');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const QuestionnaireTemplate = require('../../../../../models/questionnaire_template');
const { formatLatestQuestionnaire } = require('../../../../../utils/history/formatHistory');

const handleUpdateHistoryQuestionnaire = async (change, io) => {
    const updatedFields = change.updateDescription.updatedFields;

    if (updatedFields) {
        const questionnaireId = change.documentKey._id;
        const questionnaireHistory = await PatientQuestionnaireHistory.findById(questionnaireId);

        if (!questionnaireHistory) {
            throw new Error(`Questionário não foi encontrado no histórico: ${questionnaireId}`);
        }

        const patientId = questionnaireHistory.patientId;
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            throw new Error(`Paciente não encontrado: ${patientId}`);
        }

        const treatment = await Treatment.findOne({ patientId: patientId });
        if (!treatment) {
            throw new Error("Tratamento não encontrado");
        }

        const doctorId = treatment.doctorId;

        if (updatedFields['questionnaire.pending'] === false) {
            if (updatedFields['questionnaire.answered'] === true) {
                console.log("Questionário respondido");
                // Enviar notificação
            }
            else if (updatedFields['questionnaire.answered'] === false) {
                console.log("Questionário não respondido");
                // Enviar notificação
            }

            const latestQuestionnaire = await formatLatestQuestionnaire(questionnaireHistory);

            await emitUpdateHistory(io, doctorId, patientId);
            await emitHistoryQuestionnaireUpdate(io, doctorId, latestQuestionnaire, "updateLatestQuestionnaire");
        }
    }
}

module.exports = handleUpdateHistoryQuestionnaire;