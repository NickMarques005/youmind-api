const { getAgenda } = require('../../agenda/agenda_manager');
const { addNewQuestionnaire } = require('../../services/questionnaires/addNewQuestionnaire');
const { checkAndScheduleMedications } = require('../../services/medications/medicationScheduler');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const Treatment = require('../../models/treatment');

const handleAddNewQuestionnaire = async (patientId) => {
    const template = await QuestionnaireTemplate.findOne({});
    if (!template) {
        console.log('Nenhum template de questionário encontrado.');
        return;
    }
    await addNewQuestionnaire(patientId, template._id);
}

const handleCheckAndScheduleMedications = async (patientId) => {
    const agenda = getAgenda();
    await checkAndScheduleMedications(patientId, agenda);
}

const handleStartPatientTreatmentServices = async (patientId) => {
    await handleAddNewQuestionnaire(patientId);
    await handleCheckAndScheduleMedications(patientId);
    console.log("Serviços de questionário e medicamento do paciente ativados");
}

module.exports = {
    handleAddNewQuestionnaire,
    handleCheckAndScheduleMedications,
    handleStartPatientTreatmentServices
};