const { PatientUser } = require('../../../../models/users');
const Medication = require('../../../../models/medication');
const Treatment = require('../../../../models/treatment');
const { initializeMedicationScheduleProcess } = require('../../../../services/medications/medicationScheduler');
const { getAgenda } = require('../../../../agenda/agenda_manager');

const handleInsertMedication = async (change, io) => {
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

    /*
    ### Início do agendamento do medicamento
    */
    await initializeMedicationScheduleProcess(newMedication, agenda);

    const existingMedication = await Medication.findOne({ _id: newMedication._id });
    if (!existingMedication) {
        console.log(`O medicamento para atualização de agendamento não foi encontrado.`);
        return;
    }
    existingMedication.isScheduled = true;
    await existingMedication.save();
};

module.exports = handleInsertMedication;