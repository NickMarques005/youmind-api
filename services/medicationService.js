const Medication = require('../models/medication');
const { PatientMedicationHistory } = require('../models/patient_history');
const Treatment = require('../models/treatment');

const createNewMedicationHistory = async (medicationId, patientId, scheduleTime) => {
    try {

        const treatment = await Treatment.findOne({patientId: patientId});
        if(!treatment) return console.error("Usuário não está em tratamento no momento");
        
        const currentSchedule = scheduleTime.toTimeString().slice(0, 5);

        const newMedicationHistory = await PatientMedicationHistory.create({
            patientId: patientId,
            medication: {
                medicationId: medicationId,
                currentSchedule: currentSchedule,
                consumeDate: scheduleTime
            },
            treatmentId: treatment._id,
            
        });

        return newMedicationHistory;
    } catch (err) {
        console.error(`Erro ao criar novo histórico de medicamento: ${err.message}`);
        throw err;
    }
}

const updateMedicationHistoryToAlert = async (medicationHistoryId) => {
    try {
        console.log("**Atualizar medicamento para Alert!!**");
        const updatedMedicationHistory = await PatientMedicationHistory.findByIdAndUpdate(
            medicationHistoryId,
            { $set: { 'medication.alert': true } },
            { new: true } 
        );
        return updatedMedicationHistory;
    } catch (err) {
        console.error(`Erro ao atualizar medicamento: ${err.message}`);
        throw err;
    }
}

module.exports = { createNewMedicationHistory, updateMedicationHistoryToAlert }