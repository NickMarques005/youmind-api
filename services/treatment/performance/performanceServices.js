const { PatientMedicationHistory, PatientQuestionnaireHistory } = require("../../../models/patient_history");
const { calculateQuestionnairePerformance } = require("../../../utils/questionnaires/performance");

// Função para calcular o desempenho do tratamento
const calculateTreatmentOverallPerformance = async (patientId) => {
    // Buscar históricos de medicações e questionários para o paciente
    const patientMedications = await PatientMedicationHistory.find({ patientId });
    const patientQuestionnaires = await PatientQuestionnaireHistory.find({ patientId });

    // Filtrar e calcular o desempenho
    const totalMedications = patientMedications.length;
    const takenMedications = patientMedications.filter(history => history.medication.taken === true).length;

    const medicationPerformance = totalMedications > 0 ? (takenMedications / totalMedications) * 100 : 0;
    const questionnairePerformance = calculateQuestionnairePerformance(patientQuestionnaires);

    // Garantir que as performances não excedam 100
    const clampedMedicationPerformance = Math.min(medicationPerformance, 100);
    const clampedQuestionnairePerformance = Math.min(questionnairePerformance, 100);

    // Fator de atenuação para tratamentos iniciais com poucos dados
    const minimumDataThreshold = 5; // Número mínimo de entradas para calcular uma performance sólida
    const dampingFactor = totalMedications < minimumDataThreshold && patientQuestionnaires.length < minimumDataThreshold ? 0.5 : 1;

    // Calcular o desempenho geral
    const overallPerformance = Math.round(((clampedMedicationPerformance + clampedQuestionnairePerformance) / 2) * dampingFactor);

    // Garantir que o desempenho geral não exceda 100
    return Math.min(overallPerformance, 100);
};

module.exports = {
    calculateTreatmentOverallPerformance
};