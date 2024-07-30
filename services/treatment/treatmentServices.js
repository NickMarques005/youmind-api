const { getAgenda } = require('../../agenda/agenda_manager');
const { addNewQuestionnaire } = require('../../services/questionnaires/addNewQuestionnaire');
const { checkAndScheduleMedications } = require('../../services/medications/medicationScheduler');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const moment = require('moment-timezone');

const handleAddNewQuestionnaire = async (patientId) => {
    // Verificar horário atual, se for antes de meio dia então irá buscar template matutino, e se for depois das 8 da noite então irá buscar por template noturno
    // Se o horário for entre meio dia e 8 da noite então não enviará um questionário, então pode retornar.
    const now = moment().tz('America/Sao_Paulo');
    const currentHour = now.hour();
    const morningLimit = 12;
    const eveningStart = 20;

    let timeSlot;
    if (currentHour < morningLimit) {
        timeSlot = 'matutino';
    } else if (currentHour >= eveningStart) {
        timeSlot = 'noturno';
    } else {
        console.log("Não é o momento de enviar um questionário (entre meio dia e 8 da noite).");
        return;
    }

    const template = await QuestionnaireTemplate.findOne({ time: timeSlot });
    if (!template) {
        console.log(`Nenhum template de questionário encontrado para o horário ${timeSlot}.`);
        return;
    }
    
    await addNewQuestionnaire(patientId, template._id, timeSlot);
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