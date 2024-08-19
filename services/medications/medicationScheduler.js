const Medication = require('../../models/medication');
const { scheduleMedicationTask } = require('../../agenda/defines/medications');
const { getNextScheduleTime } = require('../../utils/date/timeZones');

const checkAndScheduleMedications = async (patientId, agenda) => {
    if (!agenda) {
        console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamentos.");
        return;
    }

    try {

        const unscheduledMedications = await Medication.find({
            patientId: patientId,
            $or: [{ isScheduled: false }, { isScheduled: { $exists: false } }]
        });

        if(unscheduledMedications.length === 0)
        {
            return console.log("Não há medicamentos para agendar");
        }

        for (const medication of unscheduledMedications) {
            console.log("Medicamento não agendado: ", medication.name);

            const nextScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency);

            await scheduleMedicationTask(medication, nextScheduleTime, agenda);
            medication.isScheduled = true;
            await medication.save();
        }
    } catch (error) {
        console.error(`Erro ao verificar e agendar medicamentos: ${error.message}`);
    }
};

const scheduleMedicationNotTakenTask = async (medicationHistory, medication, agenda) => {
    console.log("\n*****\n");
    console.log("Medication Not Taken Task: \n");
    if (!agenda) {
        console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamentos.");
        return;
    }

    const { alarmDuration } = medication;

    if (!alarmDuration) {
        console.error(`Duração do alarme não encontrada para o medicamento: ${medication._id}`);
        return;
    }

    const notTakenTime = new Date(Date.now() + alarmDuration * 1000);

    console.log(`\n***Schedule Medication Not Taken: ***\n*** notTakenTime: ${notTakenTime} ***\n`);
    const jobId = `medicationNotTaken-${medicationHistory._id}-${notTakenTime}`;

    await agenda.schedule(notTakenTime, 'medication not taken', {
        medicationHistoryId: medicationHistory._id,
    }, { jobId });

    console.log(`Tarefa medication not taken agendada para ${notTakenTime}`);
    console.log("\n*****\n");
};

const cancelMedicationSchedules = async (patientId, agenda) => {
    console.log("\n*****\n");
    console.log("Cancelamento dos agendamentos de medicações: \n");
    if (!agenda) {
        console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamentos.");
        return;
    }

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
            console.log("\n*****\n");
        }
    } catch (err) {
        console.error(`Erro ao cancelar agendamentos de medicamentos: ${err.message}`);
    }
}

module.exports = { checkAndScheduleMedications, scheduleMedicationNotTakenTask, cancelMedicationSchedules }