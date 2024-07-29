const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate } = require('../../../../../services/history/historyService');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const { PatientUser } = require('../../../../../models/users');
const QuestionnaireTemplate = require('../../../../../models/questionnaire_template');
const { formatLatestQuestionnaire } = require('../../../../../utils/history/formatHistory');

const handleInsertHistoryQuestionnaire = async (change, io) => {
    const questionnaireId = change.documentKey._id;
    const questionnaireHistory = await PatientQuestionnaireHistory.findById(questionnaireId);

    if (!questionnaireHistory) {
        throw new Error(`Questionário não foi encontrado no histórico: ${questionnaireId}`);
    }

    const questionnaireTemplate = await QuestionnaireTemplate.findById(templateId);
    if (!questionnaireTemplate) {
        throw new Error("Template de questionário não encontrado");
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

    const latestQuestionnaire = await formatLatestQuestionnaire(questionnaireHistory);

    await emitUpdateHistory(io, doctorId, patientId);
    await emitHistoryQuestionnaireUpdate(io, doctorId, { latestQuestionnaire }, "updateLatestQuestionnaire")
}

module.exports = handleInsertHistoryQuestionnaire;