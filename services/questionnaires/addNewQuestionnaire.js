const Questionnaire = require("../../models/questionnaire");
const { PatientUser } = require("../../models/users");
const { getCurrentDateInBrazilTime } = require("../../utils/date/timeZones");
const { createNewQuestionnaire } = require("./questionnaireService");

const hasAlreadyAddedQuestionnaires = async (patientId, questionnaireTemplateId) => {
    const currentDate = getCurrentDateInBrazilTime();
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const addedQuestionnaires = await Questionnaire.find({
        patientId,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });

    return addedQuestionnaires.length > 0;
}


const addNewQuestionnaire = async (patientId, questionnaireTemplateId) => {

    if (!patientId || !questionnaireTemplateId) {
        console.error('Erro ao adicionar novo questionário: Valores inválidos');
        return;
    }

    if(hasAlreadyAddedQuestionnaires(patientId, questionnaireTemplateId))
    {
        return console.log("\nQuestionário já adicionado hoje\n");
    }

    try {
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.log(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const questionnaire = await createNewQuestionnaire(patientId, questionnaireTemplateId);

        if (questionnaire) {
            console.log(`Questionário criado e notificação enviada para o paciente ${patientId}`);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
}

module.exports = { addNewQuestionnaire, hasAlreadyAddedQuestionnaires };