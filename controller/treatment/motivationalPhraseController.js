const DailyMotivationalPhrase = require("../../models/daily_motivational_phrase");
const MotivationalPhraseTemplate = require("../../models/motivational_phrase_template");
const { PatientUser } = require("../../models/users");
const { assignNewPhraseToPatient, verifyPhraseForToday } = require("../../services/motivational_phrases/motivationalPhrasesServices");
const { HandleError, HandleSuccess } = require("../../utils/response/handleResponse");

exports.getAllMotivationalPhrasesFromPatient = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError("Paciente não encontrado");

        const patientId = patient.uid;
        /*
        ### Busca todas as frases motivacionais do paciente
        */
        let phrases = await DailyMotivationalPhrase.find({ patientId }).populate('phraseId');

        if (phrases.length === 0) {
            // Verifica se a frase do dia existe e cria uma nova se não existir
            let newPhrase = await verifyPhraseForToday(patientId);
            if (!newPhrase) {
                newPhrase = await assignNewPhraseToPatient(patientId);
            }

            //Adiciona a nova frase à lista de frases a serem entregues ao paciente
            phrases = phrases.concat(newPhrase);
        }

        return HandleSuccess(res, 200, "Frases buscadas com sucesso", phrases);
    } catch (err) {
        console.error("Houve um erro ao buscar frases de paciente: ", err);
        return HandleError(res, 500, `Erro ao buscar frases motivacionais: ${err.message}`);
    }
}

exports.verify_Viewing = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const patient = await PatientUser.findOne({ uid });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        const { phraseId } = req.body;
        if (!phraseId) return HandleError(res, 400, "Oops! Erro inesperado. O campo de registro da frase não foi especificada");

        /*
        ### Busca a frase específica do paciente
        */
        const phrase = await DailyMotivationalPhrase.findOne({ _id: phraseId, patientId: patient.uid });
        if (!phrase) return HandleError(res, 404, "Frase motivacional não encontrada");

        /* 
        ### Verifica se a frase já foi visualizada
        */
        if (!phrase.viewed) {
            phrase.viewed = true;
            await phrase.save();
        }

        return HandleSuccess(res, 200, "Frase visualizada", phrase)
    }
    catch (err) {
        console.error("Houve um erro ao verificar frase: ", err);
        return HandleError(res, 500, `Erro ao verificar frase: ${err.message}`);
    }
}