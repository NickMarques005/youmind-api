const Medication = require('../models/medication');
const { PatientMedicationHistory } = require('../models/patient_history');
const Treatment = require('../models/treatment');
const agenda = require('../agenda/agenda_config');

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

const cancelMedicationSchedules = async (patientId) => {
    try {
        
        const medications = await Medication.find({ patientId: patientId });
        if (!medications || medications.length === 0) {
            console.log("Nenhum medicamento encontrado para o paciente");
            return;
        }

        for (const medication of medications) {
            const canceledAlerts = await agenda.cancel({ name: 'send medication alert', 'data.medicationId': medication._id });
            const canceledNotTaken = await agenda.cancel({ name: 'medication not taken', 'data.medicationId': medication._id });

            if (canceledAlerts > 0) {
                console.log(`Agendamentos de alertas cancelados para o medicamento: ${medication._id}`);
            } else {
                console.warn(`Nenhum agendamento de alerta foi cancelado para o medicamento: ${medication._id}`);
            }

            if (canceledNotTaken > 0) {
                console.log(`Agendamentos de "não tomado" cancelados para o medicamento: ${medication._id}`);
            } else {
                console.warn(`Nenhum agendamento de "não tomado" foi cancelado para o medicamento: ${medication._id}`);
            }
            medication.isScheduled = false;
            await medication.save();
        }
    } catch (err) {
        console.error(`Erro ao cancelar agendamentos de medicamentos: ${err.message}`);
    }
}

module.exports = { createNewMedicationHistory,updateMedicationHistoryToAlert, cancelMedicationSchedules }