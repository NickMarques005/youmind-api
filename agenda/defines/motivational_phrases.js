const { PatientUser } = require("../../models/users");
const { verifyPhraseForToday, assignNewPhraseToPatient, removeOldestPhrase } = require("../../services/motivational_phrases/motivationalPhrasesServices");
const { emitNewMotivationalPhrase } = require("../../socket/events/motivationalPhraseEvents");

// Função para lidar com a atualização diária das frases motivacionais
const handleUpdateDailyMotivationalPhrases = async () => {
    try {
        /*
        ### Buscar todos os pacientes que possuem tratamento em andamento
        */
        const patients = await PatientUser.find({ is_treatment_running: true });
        
        for (const patient of patients) {
            const patientId = patient.uid;
            
            // Verifique se a frase do dia já existe para o paciente
            let newPhrase = await verifyPhraseForToday(patientId);
            if (!newPhrase) {
                // Se não houver frase do dia, atribua uma nova
                newPhrase = await assignNewPhraseToPatient(patientId);
            }

            // Busca das frases do paciente para verificar se há mais frases do que o limite permitido
            // Se tiver então removerá a frase mais antiga
            await removeOldestPhrase(patientId);

            // Envie a nova frase para o paciente via socket
            await emitNewMotivationalPhrase({ io: null, newMotivationalPhrase: newPhrase });
        }

        console.log('Atualização diária de frases motivacionais concluída com sucesso.');
    } catch (error) {
        console.error('Erro ao atualizar frases motivacionais:', error);
    }
};

module.exports = {
    handleUpdateDailyMotivationalPhrases
};