const Questionnaire = require('../models/questionnaire');
const QuestionnaireTemplate = require('../models/questionnaire_template');
const { getFormattedQuestionnaireName } = require('../utils/questionnaires/format');
const { PatientQuestionnaireHistory } = require('../models/patient_history');
const Treatment = require('../models/treatment');

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

const createNewQuestionnaire = async (patientId, templateId) => {

    try {
        const treatment = await Treatment.findOne({ patientId: patientId });
        if (!treatment) return console.error("Usuário não está em tratamento no momento");

        const questionnaireTemplate = await QuestionnaireTemplate.findById(templateId);

        if (!questionnaireTemplate) {
            throw new Error("Template de questionário não encontrado");
        }

        const currentDate = new Date();
        const name = getFormattedQuestionnaireName();

        const expirationDate = new Date(currentDate);
        expirationDate.setDate(expirationDate.getDate() + 1);
        expirationDate.setHours(4, 0, 0, 0);

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

module.exports = { validateQuestions, createNewQuestionnaire };