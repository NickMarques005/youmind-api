const { PatientUser } = require('../../../../../models/users');
const Treatment = require('../../../../../models/treatment');
const { emitUpdateHistory } = require('../../../../../services/history/historyService');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');

const handleUpdateHistoryQuestionnaire = async (change, io) => {
    const updatedFields = change.updateDescription.updatedFields;
    if (updatedFields && (updatedFields['questionnaire.answered'] === false || updatedFields['questionnaire.answered'] === true)) {
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
    }
    return;
}

module.exports = handleUpdateHistoryQuestionnaire;