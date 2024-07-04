const { PatientUser } = require('../../../../models/users');
const Medication = require('../../../../models/medication');
const { scheduleMedicationTask } = require('../../../../agenda/defines/medications');
const { getAgenda } = require('../../../../agenda/agenda_manager');
const Treatment = require('../../../../models/treatment');

const handleInsertMedication = async (change) => {
    const agenda = getAgenda();
    const newMedication = change.fullDocument;
    const patientId = newMedication.patientId;

    const patient = await PatientUser.findOne({ uid: patientId });
    if (!patient) {
        console.error(`Paciente não encontrado: ${patientId}`);
        return;
    }

    const activeTreatment = await Treatment.findOne({ patientId: patientId, status: 'active' });
    if (!activeTreatment) {
        console.log(`Paciente ${patientId} não possui tratamento ativo. Medicamento não será agendado.`);
        return;
    }

    if (agenda) {
        
        const firstScheduleTime = getNextScheduleTime(newMedication.schedules, newMedication.start, newMedication.frequency, 'America/Sao_Paulo');
        await scheduleMedicationTask(newMedication, firstScheduleTime, agenda);
    }

    const existingMedication = await Medication.findOne({ _id: newMedication._id });
    if (!existingMedication) {
        console.log(`O medicamento para atualização de agendamento não foi encontrado.`);
        return;
    }
    existingMedication.isScheduled = true;
    await existingMedication.save();
};

module.exports = handleInsertMedication;