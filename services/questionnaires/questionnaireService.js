const Questionnaire = require('../../models/questionnaire');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const { getFormattedQuestionnaireName } = require('../../utils/questionnaires/format');
const { PatientQuestionnaireHistory } = require('../../models/patient_history');
const Treatment = require('../../models/treatment');
const { getCurrentDateInBrazilTime, getExpirationDateInUTC } = require('../../utils/date/timeZones');

const validateQuestions = (questions) => {
    if (!Array.isArray(questions)) return false;

    for (const question of questions) {
        if (typeof question.title !== 'string') return false;
        if (!Array.isArray(question.answers)) return false;

        for (const answer of question.answers) {
            if (typeof answer.answer !== 'string') return false;
            if (!['precisa_melhorar', 'ruim', 'bom', 'ótimo', 'excelente'].includes(answer.type)) return false;
        }

        if (question.sub_questions) {
            if (!Array.isArray(question.sub_questions)) return false;
            for (const subQuestion of question.sub_questions) {
                if (typeof subQuestion !== 'string') return false;
            }
        }
    }

    return true;
};

const createNewQuestionnaire = async (patientId, templateId, timeSlot) => {
    console.log("Criando novo questionário para o usuário ", patientId);
    try {
        const treatment = await Treatment.findOne({ patientId: patientId, status: "active" });
        if (!treatment) return console.error("Usuário não está em tratamento no momento");

        const questionnaireTemplate = await QuestionnaireTemplate.findById(templateId);

        if (!questionnaireTemplate) {
            throw new Error("Template de questionário não encontrado");
        }

        const currentDate = getCurrentDateInBrazilTime();
        const name = getFormattedQuestionnaireName(timeSlot);

        let expirationDate;
        switch (timeSlot) {
            case 'matutino':
                expirationDate = getExpirationDateInUTC(currentDate, 'America/Sao_Paulo', 0, 12);
                break;
            case 'noturno':
                expirationDate = getExpirationDateInUTC(currentDate, 'America/Sao_Paulo', 1, 2);
                break;
            default:
                expirationDate = getExpirationDateInUTC(currentDate, 'America/Sao_Paulo', 1, 2);
                break;
        }

        const newQuestionnaire = new Questionnaire({
            patientId,
            expiredAt: expirationDate,
            name,
            questionnaireTemplateId: templateId
        });

        await newQuestionnaire.save();

        const newQuestionnaireHistory = new PatientQuestionnaireHistory({
            patientId: patientId,
            questionnaire: {
                questionnaireId: newQuestionnaire._id
            },
            treatmentId: treatment._id
        });

        await newQuestionnaireHistory.save();

        return newQuestionnaire;
    } catch (err) {
        console.error(`Erro ao criar novo questionário: ${err.message}`);
        throw err;
    }
}

const filteringQuestionnaireTemplate = async (template, patient) => {
    let filteredQuestions = [];

    for (const question of template.questions) {

        if (question.responsePeriod && question.responseTime) {
            const currentDate = new Date();
            let responsePeriodEnd = new Date(currentDate);

            if (question.responseTime === "dias") {
                responsePeriodEnd.setDate(responsePeriodEnd.getDate() - question.responsePeriod);
            } else if (question.responseTime === "meses") {
                responsePeriodEnd.setMonth(responsePeriodEnd.getMonth() - question.responsePeriod);
            }

            console.log(`Periodo da pergunta "${question.title}": `, responsePeriodEnd);

            // Buscar questionários que contenham esta pergunta dentro do período especificado
            const recentQuestionnaires = await Questionnaire.find({
                patientId: patient._id,
                "answers.questionId": question._id.toString(),
                createdAt: { $gte: responsePeriodEnd }
            });

            if (recentQuestionnaires.length === 0) {
                filteredQuestions.push(question);
            }
        } else {
            filteredQuestions.push(question);
        }
    }

    return {
        ...template,
        questions: filteredQuestions
    };
};

const emitNewQuestionnaire = async (io, patientId, newQuestionnaire, event) => {
    try {
        if (await emitEventToUser(io, patientId, event, { questionnaire: newQuestionnaire })) {
            console.log(`Novo questionário emitido para o paciente ${patientId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir novo questionário:', error);
    }
}

module.exports = {
    validateQuestions,
    createNewQuestionnaire,
    filteringQuestionnaireTemplate,
    emitNewQuestionnaire
};