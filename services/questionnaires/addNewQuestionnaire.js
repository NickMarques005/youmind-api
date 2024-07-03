const { PatientUser } = require("../../models/users");
const { createNewQuestionnaire } = require("./questionnaireService");

const addNewQuestionnaire = async (patientId, questionnaireTemplateId) => {

    if (!patientId || !questionnaireTemplateId) {
        console.error('Mensagem inválida recebida:', message.Body);
        return;
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

module.exports = { addNewQuestionnaire };