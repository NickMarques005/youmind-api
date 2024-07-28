const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate } = require('../../../../../services/history/historyService');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const { PatientUser } = require('../../../../../models/users');

const handleInsertHistoryQuestionnaire = async (change, io) => {
    const questionnaireId = change.documentKey._id;
    const questionnaireHistory = await PatientQuestionnaireHistory.findById(questionnaireId);

    if (!questionnaireHistory) {
        console.error(`Questionário não foi encontrado no histórico: ${questionnaireId}`);
        return;
    }

    const patientId = questionnaireHistory.patientId;
    const patient = await PatientUser.findOne({ uid: patientId });
    if (!patient) {
        console.error(`Paciente não encontrado: ${patientId}`);
        return;
    }

    const treatment = await Treatment.findOne({ patientId: patientId });
    if (!treatment) {
        console.log("Tratamento não encontrado");
        return;
    }

    const doctorId = treatment.doctorId;

    await emitUpdateHistory(io, doctorId, patientId);
    await emitHistoryQuestionnaireUpdate(io, doctorId, questionnaireHistory, "updateLatestQuestionnaire");
}

module.exports = handleInsertHistoryQuestionnaire;