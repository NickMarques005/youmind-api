const { PatientMedicationHistory, PatientQuestionnaireHistory } = require("../../models/patient_history");
const Treatment = require("../../models/treatment");
const { calculateQuestionnairePerformance } = require("../../utils/questionnaires/performance");
const { emitEventToUser } = require("../../utils/socket/connection");

const getPatientHistoryById = async (patientId) => {
    const treatment = await Treatment.findOne({ patientId: patientId });
    if (!treatment) {
        console.error('Tratamento não encontrado para o paciente');
        return;
    }

    const medicationHistory = await PatientMedicationHistory.find({ patientId: patientId });
    const questionnaireHistory = await PatientQuestionnaireHistory.find({ patientId: patientId });

    const totalMedications = medicationHistory.length;
    const takenMedications = medicationHistory.filter(med => med.medication.taken).length;
    const medicationPerformance = totalMedications > 0 ? (takenMedications / totalMedications) * 100 : 0;

    const questionnairePerformance = calculateQuestionnairePerformance(questionnaireHistory);

    let overallPerformance = (medicationPerformance + questionnairePerformance) / 2;
    overallPerformance = Math.round(Math.min(Math.max(overallPerformance, 0), 100));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekTaken = medicationHistory.filter(med => !med.medication.taken && new Date(med.medication.consumeDate) >= oneWeekAgo).length;

    return {
        patientId,
        treatmentId: treatment._id,
        medicationHistory: {
            total: totalMedications,
            taken: takenMedications,
            notTaken: medicationHistory.filter(med => !med.medication.taken).length,
        },
        questionnaireHistory: {
            total: questionnaireHistory.length,
            answered: questionnaireHistory.filter(questionnaire => questionnaire.questionnaire.answered).length,
            notAnswered: questionnaireHistory.filter(questionnaire => !questionnaire.questionnaire.answered).length,
        },
        overallPerformance: overallPerformance,
        questionnairePerformance: Math.round(questionnairePerformance),
        medicationPerformance: Math.round(medicationPerformance),
        lastWeekTaken: lastWeekTaken
    };
};

const emitUpdateHistory = async (io, doctorId, patientId) => {
    try {
        const updateHistory = await getPatientHistoryById(patientId);
        if (updateHistory) {
            await emitEventToUser(io, doctorId, "updateHistory", { history: updateHistory });
        }
    } catch (error) {
        console.error('Erro ao emitir histórico:', error);
    }
};

const emitHistoryMedicationUpdate = async (io, doctorId, latestMedication, event) => {
    try {
        if (await emitEventToUser(io, doctorId, event, { latestMedication })) {
            console.log(`Histórico de medicamentos emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de medicamentos:', error);
    }
};

const emitHistoryQuestionnaireUpdate = async (io, doctorId, latestQuestionnaire, event) => {
    try {
        if (await emitEventToUser(io, doctorId, event, { latestQuestionnaire })) {
            console.log(`Histórico de questionários emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico de questionários:', error);
    }
};

module.exports = { getPatientHistoryById, emitUpdateHistory, emitHistoryMedicationUpdate, emitHistoryQuestionnaireUpdate }