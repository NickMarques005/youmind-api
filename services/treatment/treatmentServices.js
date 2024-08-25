const { getAgenda } = require('../../agenda/agenda_manager');
const { addNewQuestionnaire } = require('../../services/questionnaires/addNewQuestionnaire');
const { checkAndScheduleMedications } = require('../../services/medications/medicationScheduler');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const moment = require('moment-timezone');

const handleAddNewQuestionnaire = async (patientId) => {
    // Verificar horário atual, se o horário for entre 8 da noite e 2 da manhã então enviará um questionário para o paciente responder
    const now = moment().tz('America/Sao_Paulo');
    const currentHour = now.hour();
    //Periodo do questionário noturno:
    const eveningStart = 20;
    const nightEnd = 2;

    let timeSlot;
    // Verificar se o horário atual está entre 20:00 e 02:00
    if (currentHour >= eveningStart || currentHour < nightEnd) {
        timeSlot = 'noturno';
    } else {
        console.log("Não é o momento de enviar um questionário (entre 08 da noite e 02 da manhã).");
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
    console.log("Serviço de questionário do paciente ativado");
}

module.exports = {
    handleAddNewQuestionnaire,
    handleCheckAndScheduleMedications,
    handleStartPatientTreatmentServices
};