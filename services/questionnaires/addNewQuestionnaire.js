const Questionnaire = require("../../models/questionnaire");
const { PatientUser } = require("../../models/users");
const { getCurrentDateInBrazilTime } = require("../../utils/date/timeZones");
const { createNewQuestionnaire } = require("./questionnaireService");
const moment = require('moment-timezone');
const { sendNewQuestionnaireToPatient } = require("./sendQuestionnaireEvent");

const hasAlreadyAddedQuestionnaires = async (patientId, questionnaireTemplateId, timeSlot) => {
    const currentDate = getCurrentDateInBrazilTime();
    let startOfDay, endOfDay;

    if (timeSlot === 'noturno') {
        startOfDay = moment(currentDate).tz('America/Sao_Paulo').set({ hour: 20, minute: 0, second: 0, millisecond: 0 }).toDate();
        endOfDay = moment(currentDate).tz('America/Sao_Paulo').add(1, 'days').set({ hour: 2, minute: 0, second: 0, millisecond: 0 }).toDate();
    } else {
        console.error('Time slot inválido');
        return false;
    }

    console.log(`Comparação de StartDay e EndDay para verificar se há questionários: ${startOfDay} / ${endOfDay}`);

    const addedQuestionnaires = await Questionnaire.find({
        patientId,
        questionnaireTemplateId,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });

    return addedQuestionnaires.length > 0;
}

const addNewQuestionnaire = async (patientId, questionnaireTemplateId, timeSlot, treatmentInitialization) => {
    try {
        if (!patientId || !questionnaireTemplateId || !timeSlot) {
            console.error('Erro ao adicionar novo questionário: Valores inválidos');
            return;
        }

        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.log(`Paciente não encontrado: ${patientId}`);
            return;
        }

        /*
        ### Verifica se já foi adicionado um questionário hoje
        */
        const alreadyAdded = await hasAlreadyAddedQuestionnaires(patientId, questionnaireTemplateId, timeSlot);
        if (alreadyAdded) {
            return console.log(`\nQuestionário ${timeSlot} já adicionado hoje\n`);
        }

        /*
        ### Criação do questionário
        */
        const questionnaire = await createNewQuestionnaire(patientId, questionnaireTemplateId, timeSlot, treatmentInitialization);
        if (questionnaire) {
            console.log(`Questionário do paciente ${patient.name} criado.`);
        }

        /*
        ### Se for inicio do tratamento não enviar o questionário
        */
        if (!treatmentInitialization) {
            const questionnaireSended = await sendNewQuestionnaireToPatient(questionnaire, patientId);
            if (questionnaireSended) {
                console.log(`Notificação e/ou dados mandados por socket para paciente ${patient.name}`);
            }
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
}

module.exports = { addNewQuestionnaire, hasAlreadyAddedQuestionnaires };