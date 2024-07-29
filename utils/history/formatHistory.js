const Questionnaire = require("../../models/questionnaire");
const QuestionnaireTemplate = require("../../models/questionnaire_template");

const formatLatestQuestionnaire = async (historyQuestionnaire) => {
    const questionnaire = await Questionnaire.findById(historyQuestionnaire.questionnaire.questionnaireId);
    let template;
    if (questionnaire && questionnaire.answers && questionnaire.checked) {
        template = await QuestionnaireTemplate.findById(questionnaire.questionnaireTemplateId);
    }
    return {
        _id: historyQuestionnaire._id,
        patientId: historyQuestionnaire.patientId,
        currentQuestionnaire: questionnaire,
        template,
        pending: historyQuestionnaire.questionnaire.pending,
        answered: historyQuestionnaire.questionnaire.answered,
        updatedAt: historyQuestionnaire.questionnaire.updatedAt
    };
};

const formatLatestMedication = async (historyMedication) => {
    const medication = historyMedication.medication;
    const currentMedication = {
        _id: medication.medicationId,
        name: medication.name,
        dosage: medication.dosage,
        type: medication.type,
        expiresAt: medication.expiresAt,
        frequency: medication.frequency,
        schedules: medication.schedules,
        start: medication.start,
        alarmDuration: medication.alarmDuration,
        reminderTimes: medication.reminderTimes,
        patientId: historyMedication.patientId,
        createdAt: medication.createdAt,
        updatedAt: medication.updatedAt,
    };

    return {
        _id: historyMedication._id,
        patientId: historyMedication.patientId,
        currentMedication: currentMedication,
        currentSchedule: historyMedication.medication.currentSchedule,
        pending: historyMedication.medication.pending,
        alert: historyMedication.medication.alert,
        taken: historyMedication.medication.taken,
        consumeDate: historyMedication.medication.consumeDate,
        updatedAt: historyMedication.medication.updatedAt
    };
};

module.exports = { formatLatestQuestionnaire, formatLatestMedication };