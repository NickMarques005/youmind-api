const { PatientUser } = require('../../models/users');
const Medication = require('../../models/medication');
const { scheduleMedicationTask } = require('../../agenda/defines/medications');
const { getAgenda } = require('../../agenda/agenda_manager');
const Treatment = require('../../models/treatment');

const handleMedicationChange = async (io, change) => {
    console.log("medication Change Stream Event: ", change);
    const agenda = getAgenda();

    if (change.operationType === 'insert') {
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
            const firstSchedule = newMedication.schedules[0];
            const firstScheduleTime = new Date(newMedication.start);
            const [hours, minutes] = firstSchedule.split(':');
            firstScheduleTime.setHours(hours, minutes, 0, 0);
            await scheduleMedicationTask(newMedication, firstScheduleTime, agenda);
        }


        const existingMedication = await Medication.findOne({ _id: newMedication._id });
        if (!existingMedication) {
            console.log(`O medicamento para atualização de agendamento não foi encontrado.`);
            return;
        }
        existingMedication.isScheduled = true;
        await existingMedication.save();

        return;
    }
    else if (change.operationType === 'update') {

    }
};

const medicationStream = (io) => {
    const changeStream = Medication.watch();
    changeStream.on('change', change => handleMedicationChange(io, change));
};

module.exports = medicationStream;