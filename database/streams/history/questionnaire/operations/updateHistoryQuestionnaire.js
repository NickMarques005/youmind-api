const { PatientUser } = require('../../../../../models/users');
const Treatment = require('../../../../../models/treatment');
const { PatientQuestionnaireHistory } = require('../../../../../models/patient_history');
const { formatLatestQuestionnaire } = require('../../../../../utils/history/formatHistory');
const { emitUpdateHistory, emitHistoryQuestionnaireUpdate, emitHistoryQuestionnaireDelete } = require('../../../../../socket/events/historyPatientEvents');

const handleUpdateHistoryQuestionnaire = async (change, io) => {
    const updatedFields = change.updateDescription.updatedFields;

    if (updatedFields) {
        const questionnaireHistoryId = change.documentKey._id;
        const questionnaireHistory = await PatientQuestionnaireHistory.findById(questionnaireHistoryId);

        if (!questionnaireHistory) {
            throw new Error(`Questionário não foi encontrado no histórico: ${questionnaireHistoryId}`);
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

            await emitUpdateHistory({ io: io, doctorId: doctorId, patientId: patientId });
            await emitHistoryQuestionnaireUpdate({ io: io, doctorId: doctorId, latestQuestionnaire: latestQuestionnaire });
        }
        else if (updatedFields['delete'] === true) {

            //Excluir histórico de questionário
            await PatientQuestionnaireHistory.deleteOne({ _id: questionnaireHistoryId });

            const latestQuestionnaire = await formatLatestQuestionnaire(questionnaireHistory);

            await emitUpdateHistory({ io: io, doctorId: doctorId, patientId: patientId });
            await emitHistoryQuestionnaireDelete({ io: io, doctorId: doctorId, latestQuestionnaire: latestQuestionnaire });
        }
    }
}

module.exports = handleUpdateHistoryQuestionnaire;