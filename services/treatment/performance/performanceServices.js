const { PatientMedicationHistory, PatientQuestionnaireHistory } = require("../../../models/patient_history");
const { calculateQuestionnairePerformance } = require("../../../utils/questionnaires/performance");


// Função para calcular o desempenho do tratamento
const calculateTreatmentOverallPerformance = async (patientId) => {
    /*
    ### Buscar históricos de medicações e questionários para o paciente
    */
    const patientMedications = await PatientMedicationHistory.find({ patientId });
    const patientQuestionnaires = await PatientQuestionnaireHistory.find({ patientId });

    /*
    ### Filtrar e calcular o desempenho
    */
    const totalMedications = patientMedications.length;
    const takenMedications = patientMedications.filter(history => history.medication.taken === true).length;

    const medicationPerformance = totalMedications > 0 ? (takenMedications / totalMedications) * 100 : 0;
    const questionnairePerformance = calculateQuestionnairePerformance(patientQuestionnaires);
    const overallPerformance = Math.round(Math.min(Math.max((medicationPerformance + questionnairePerformance) / 2, 0), 100));

    return overallPerformance;
};

module.exports = {
    calculateTreatmentOverallPerformance
};