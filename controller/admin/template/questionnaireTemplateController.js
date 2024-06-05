const { HandleError, HandleSuccess } = require('../../../utils/response/handleResponse');
const QuestionnaireTemplate = require('../../../models/questionnaire_template');
const { validateQuestions } = require('../../../services/questionnaireService');

exports.createTemplate = async (req, res) => {
    try {
        const { questions } = req.body;

        if(!questions) return HandleError(res, 400, "Questionário Template não especificado");

        if (!validateQuestions(questions)) {
            return HandleError(res, 400, "Estrutura de Questionário Template inválida");
        }

        const newTemplate = new QuestionnaireTemplate({
            questions
        });

        await newTemplate.save();
        return HandleSuccess(res, 201, "Template criado com sucesso", newTemplate);
    } catch (err) {
        console.error("Erro no servidor: ", err);
        return HandleError(res, 500, "Erro interno no servidor ao criar Template");
    }
};
