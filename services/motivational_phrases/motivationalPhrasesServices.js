
const DailyMotivationalPhrase = require("../../models/daily_motivational_phrase");
const MotivationalPhraseTemplate = require("../../models/motivational_phrase_template");
const { limitPhrases } = require("../../utils/motivational_phrases/limit");

const verifyPhraseForToday = async (patientId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await DailyMotivationalPhrase.findOne({ patientId, date: today });
};

const removeOldestPhrase = async (patientId) => {
    const phraseCount = await DailyMotivationalPhrase.countDocuments({ patientId });

    if (phraseCount >= limitPhrases) {
        const oldestPhrase = await DailyMotivationalPhrase.findOne({ patientId }).sort({ date: 1 });
        if (oldestPhrase) {
            await DailyMotivationalPhrase.deleteOne({ _id: oldestPhrase._id });
        }
    }
};

const assignNewPhraseToPatient = async (patientId) => {
    const existingPhrase = await verifyPhraseForToday(patientId);
    if (existingPhrase) {
        return existingPhrase;
    }

    /*
    ### Obter IDs de frases que já foram usadas pelo paciente
    */
    const usedPhraseIds = await DailyMotivationalPhrase.find({ patientId }).distinct('phraseId');

    /*
    ### Selecionar uma frase que ainda não foi usada
    */ 
    let availablePhrases = await MotivationalPhraseTemplate.find({ _id: { $nin: usedPhraseIds } });

    /*
    ### Se todas as frases já foram usadas, reiniciar o ciclo excluindo todas as frases do paciente
    */
    if (availablePhrases.length === 0) {
        await DailyMotivationalPhrase.deleteMany({ patientId });
        usedPhraseIds.length = 0; // Resetar o array de frases usadas
        availablePhrases = await MotivationalPhraseTemplate.find({});
    }

    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    const selectedPhrase = availablePhrases[randomIndex];

    /*
    ### Remover a frase mais antiga, se necessário
    */ 
    await removeOldestPhrase(patientId);

    /*
    ### Salvar a nova frase do dia para o paciente
    */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyPhrase = new DailyMotivationalPhrase({
        patientId,
        phraseId: selectedPhrase._id,
        date: today
    });

    await dailyPhrase.save();

    return dailyPhrase;
};

const getAllPhrasesForPatient = async (patientId) => {
    /*
    ### Busca todas as frases do paciente
    */
    return await DailyMotivationalPhrase.find({ patientId }).populate('phraseId').exec();
};

module.exports = {
    verifyPhraseForToday,
    removeOldestPhrase,
    assignNewPhraseToPatient,
    getAllPhrasesForPatient
};