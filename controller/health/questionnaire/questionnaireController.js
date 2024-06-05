const Questionnaire = require('../../../models/questionnaire');
const QuestionnaireTemplate = require('../../../models/questionnaire_template');
const { HandleError, HandleSuccess } = require('../../../utils/response/handleResponse');
const { PatientUser } = require('../../../models/users');
const Treatment = require('../../../models/treatment');
const MessageTypes = require('../../../utils/response/typeResponse');
const { PatientQuestionnaireHistory, addAnsweredField } = require('../../../models/patient_history');

exports.getQuestionnaires = async (req, res) => {
    try {
        const { uid } = req.user;

        if (!uid) return HandleError(res, 400, "Não autorizado");

        const patient = await PatientUser.findOne({ uid });
        if (!patient) return HandleError(res, 403, "Você não é um paciente registrado");

        const treatment = await Treatment.findOne({ patientId: patient.uid, status: "active" });
        if (!treatment) return HandleSuccess(res, 200, "Você não está em tratamento no momento", []);

        const questionnaires = await Questionnaire.find({ patientId: treatment.patientId })
            .sort({ createdAt: -1 })
            .limit(7);

        if (!questionnaires || questionnaires.length === 0) return HandleError(res, 404, "Nenhum questionário encontrado");

        const result = await Promise.all(questionnaires.map(async (questionnaire) => {
            if (questionnaire.answers && questionnaire.checked) {
                const template = await QuestionnaireTemplate.findOne({ _id: questionnaire.questionnaireTemplateId });
                return {
                    currentQuestionnaire: questionnaire,
                    template
                };
            }
            return { currentQuestionnaire: questionnaire };
        }));

        return HandleSuccess(res, 200, "Questionários encontrados", result);
    } catch (err) {
        console.log("Erro no servidor: ", err.message);
        return HandleError(res, 500, "Erro interno no servidor ao buscar questionários");
    }
}

exports.getQuestionnaireTemplateById = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;

        if (!uid) return HandleError(res, 400, "Não autorizado");
        if (!id) return HandleError(res, 400, "Id do tratamento não especificado");

        const patient = await PatientUser.findOne({ uid });
        if (!patient) return HandleError(res, 403, "Você não é um paciente registrado");

        const questionnaireSelected = await Questionnaire.findById(id);
        if (!questionnaireSelected) return HandleError(res, 404, "Questionário não encontrado");

        const currentDate = new Date();
        if (currentDate > questionnaireSelected.expiredAt) {
            return HandleError(res, 400, "Seu tempo para responder o questionário infelizmente expirou.", questionnaireSelected);
        }

        const template = await QuestionnaireTemplate.findOne({ _id: questionnaireSelected.questionnaireTemplateId });

        if (!template) {
            return HandleError(res, 404, "Questões do questionário não foram encontradas");
        }

        return HandleSuccess(res, 200, "Questionário template achado", template);
    } catch (err) {
        console.log("Erro no servidor: ", err.message);
        return HandleError(res, 500, "Erro interno no servidor ao buscar Template");
    }
};

exports.SendAnswers = async (req, res) => {
    try {
        const { uid } = req.user;
        const { answers, id } = req.body;

        console.log("ID: ", id);

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!answers) return HandleError(res, 400, "Respostas não definidas");
        if (!id) return HandleError(res, 400, "Questionário não especificado");

        const questionnaire = await Questionnaire.findById(id);

        console.log("Questionário: ", questionnaire);

        if (!questionnaire) {
            return HandleError(res, 404, "Questionário não encontrado");
        }

        const currentDate = new Date();
        if (currentDate > questionnaire.expiredAt) {
            return HandleError(res, 400, "Seu tempo para responder o questionário infelizmente expirou.");
        }

        if (questionnaire.answers && questionnaire.answers.length !== 0) {
            return HandleError(res, 400, "O questionário já foi respondido");
        }

        const updatedQuestionnaire = await Questionnaire.findOneAndUpdate(
            { _id: id },
            {
                $set: { answers: answers, checked: true },
                $unset: { expiredAt: "" }
            },
            { new: true }
        );

        console.log("Questionário atualizado: ", updatedQuestionnaire);

        if (!updatedQuestionnaire) {
            return HandleError(res, 400, "Questionário não foi atualizado devidamente");
        }

        await PatientQuestionnaireHistory.findOneAndUpdate(
            { 'questionnaire.questionnaireId': updatedQuestionnaire._id },
            { 
                $set: {
                    'questionnaire.answered': true,
                    'questionnaire.pending': false,
                    'questionnaire.answers': answers
                }
            }
        );

        const template = await QuestionnaireTemplate.findOne({ _id: updatedQuestionnaire.questionnaireTemplateId });

        const result = {
            currentQuestionnaire: updatedQuestionnaire,
            template
        };

        return HandleSuccess(res, 200, "Parabéns! Suas respostas foram salvas com sucesso.", result, MessageTypes.SUCCESS);
    } catch (err) {
        console.error(`Erro ao enviar respostas: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao enviar respostas");
    }
}

