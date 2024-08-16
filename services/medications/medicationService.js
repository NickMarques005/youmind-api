const Medication = require('../../models/medication');
const { PatientMedicationHistory } = require('../../models/patient_history');
const Treatment = require('../../models/treatment');
const { formatMomentToISO, formatISOToHours } = require('../../utils/date/formatDate');
const { convertToBrazilTime } = require('../../utils/date/timeZones');

const createNewMedicationHistory = async (medication, scheduleTime) => {
    try {
        const medicationId = medication._id;
        const patientId = medication.patientId;
        const treatment = await Treatment.findOne({patientId: patientId});
        if(!treatment) return console.error("Usuário não está em tratamento no momento");
        
        console.log("MedicationHistory Criação: ");
        console.log(scheduleTime);

        const timeZoneScheduleMoment = convertToBrazilTime(scheduleTime);
        const scheduleISO = formatMomentToISO(timeZoneScheduleMoment);
        const currentSchedule = formatISOToHours(scheduleISO);

        const newMedicationHistory = await PatientMedicationHistory.create({
            patientId: patientId,
            medication: {
                medicationId: medicationId,
                currentSchedule: currentSchedule,
                consumeDate: scheduleTime,
                name: medication.name,
                dosage: medication.dosage,
                type: medication.type,
                frequency: medication.frequency,
                start: medication.start,
                expiresAt: medication.expiresAt,
                schedules: medication.schedules,
                alarmDuration: medication.alarmDuration,
                reminderTimes: medication.reminderTimes
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

const endMedication = async (medication) => {
        console.log(`Medicação ${medication.name} expirou e não será reagendada.`);
        await Medication.findByIdAndDelete(medication._id);
        return;
}

module.exports = { createNewMedicationHistory, updateMedicationHistoryToAlert, endMedication }