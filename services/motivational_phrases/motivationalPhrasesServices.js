
const DailyMotivationalPhrase = require("../../models/daily_motivational_phrase");
const MotivationalPhraseTemplate = require("../../models/motivational_phrase_template");
const { limitPhrases } = require("../../utils/motivational_phrases/limit");

/*
### Verificação para saber se há frase hoje
*/
const verifyPhraseForToday = async (patientId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await DailyMotivationalPhrase.findOne({ patientId, usedAt: today });
};

/*
### Remove a frase mais antiga do paciente
*/
const removeOldestPhrase = async (patientId) => {
    const phraseCount = await DailyMotivationalPhrase.countDocuments({ patientId });

    if (phraseCount >= limitPhrases) {
        const oldestPhrase = await DailyMotivationalPhrase.findOne({ patientId }).sort({ usedAt: 1 });
        if (oldestPhrase) {
            await DailyMotivationalPhrase.deleteOne({ _id: oldestPhrase._id });
        }
    }
};

/*
### Seleciona aleatoriamente uma das frases que estiverem disponíveis
*/
const selectRandomPhrase = async (patientId) => {
    const usedPhraseIds = await DailyMotivationalPhrase.find({ patientId }).distinct('phraseId');
    console.log("Frases já usadas por paciente: ", usedPhraseIds);
    let availablePhrases = await MotivationalPhraseTemplate.find({ _id: { $nin: usedPhraseIds } });
    console.log("Frases template disponíveis: ", availablePhrases.length);
    //Se não tiver frase disponivel, então resetar o ciclo de frases motivacionais para esse paciente
    if (availablePhrases.length === 0) {
        await DailyMotivationalPhrase.deleteMany({ patientId });
        availablePhrases = await MotivationalPhraseTemplate.find({});
    }

    //Escolha aleatoria da frase
    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    return availablePhrases[randomIndex];
};


const assignNewPhraseToPatient = async (patientId) => {
    console.log("Atribuição de nova frase ao paciente: ", patientId);

    const existingPhrase = await verifyPhraseForToday(patientId);
    if (existingPhrase) {
        return existingPhrase;
    }

    /*
    ### Selecionar uma frase aleatória usando a nova função
    */
    const selectedPhrase = await selectRandomPhrase(patientId);

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
        text: selectedPhrase.text,
        usedAt: today
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