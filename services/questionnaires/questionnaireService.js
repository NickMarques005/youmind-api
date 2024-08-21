const Questionnaire = require('../../models/questionnaire');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const { getFormattedQuestionnaireName } = require('../../utils/questionnaires/format');
const { PatientQuestionnaireHistory } = require('../../models/patient_history');
const Treatment = require('../../models/treatment');
const { getCurrentDateInBrazilTime, getExpirationDateInUTC } = require('../../utils/date/timeZones');
const { emitEventToUser } = require('../../utils/socket/connection');

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

// Filtra as questões do template com base no período de resposta
const filterTemplateQuestionsByResponsePeriod = async (template, patient) => {
    try{
        console.log("Filtragem das questões: ");
        let filteredQuestions = [];

        for (const question of template.questions) {
            console.log(`Questão "${question.title}"`)
            if (question.responsePeriod && question.responseTime) {
                let responsePeriodEnd = new Date();
    
                if (question.responseTime === "dias") {
                    responsePeriodEnd.setDate(responsePeriodEnd.getDate() - question.responsePeriod);
                } else if (question.responseTime === "meses") {
                    responsePeriodEnd.setMonth(responsePeriodEnd.getMonth() - question.responsePeriod);
                }
    
                console.log(`Periodo da pergunta "${question.title}" (id: ${question._id}): `, responsePeriodEnd);
                

                // Buscar questionários que contenham esta pergunta dentro do período especificado
                const recentQuestionnaires = await Questionnaire.find({
                    patientId: patient.uid,
                    answers: {
                        $elemMatch : { 
                            questionId: question._id 
                        }
                    },
                    createdAt: { $gte: responsePeriodEnd }
                });
    
                if (recentQuestionnaires.length === 0) {
                    console.log("Nenhum questionário anterior achado, adiciona questão");
                    filteredQuestions.push(question);
                }
                else{
                    console.log("Há questionários recentes contendo essa questão então não enviar questão");
                }
            } else {
                filteredQuestions.push(question);
            }
        }
    
        return {
            ...template,
            questions: filteredQuestions
        };
    }
    catch (err)
    {
        console.error(err);
    }
};

//Filtra as questões de template com base nas respostas feitas no questionário
const filterTemplateQuestionsByAnswers = (template, answers) => {
    const answerIds = answers.map(answer => answer.questionId);
    const filteredQuestions = template.questions.filter(question => 
        answerIds.includes(question._id.toString())
    );

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
    filterTemplateQuestionsByResponsePeriod,
    emitNewQuestionnaire,
    filterTemplateQuestionsByAnswers
};