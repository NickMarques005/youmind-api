const Treatment = require('../../../../../models/treatment');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const { PatientUser } = require('../../../../../models/users');
const { formatLatestQuestionnaire } = require('../../../../../utils/history/formatHistory');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate } = require('../../../../../socket/events/historyPatientEvents');

const handleInsertHistoryQuestionnaire = async (change, io) => {
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

    const latestQuestionnaire = await formatLatestQuestionnaire(questionnaireHistory);

    await emitUpdateHistory({ io: io, doctorId: doctorId, patientId: patientId });
    await emitHistoryQuestionnaireUpdate({ io: io, doctorId: doctorId, latestQuestionnaire: latestQuestionnaire });
}

module.exports = handleInsertHistoryQuestionnaire;