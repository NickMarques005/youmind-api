const Medication = require('../models/medication');
const { scheduleMedicationTask } = require('../agenda/defines/medications');

const checkAndScheduleMedications = async (patientId, agenda) => {
    if (!agenda) {
        console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamentos.");
        return;
    }

    try {

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const unscheduledMedications = await Medication.find({
            patientId: patientId,
            $or: [{ isScheduled: false }, { isScheduled: { $exists: false } }]
        });

        for (const medication of unscheduledMedications) {
            console.log("Medicamento não agendado: ", medication.name);

            let nextScheduleTime = null;

            for (const schedule of medication.schedules) {
                const [hours, minutes] = schedule.split(':').map(Number);
                const scheduleTime = new Date(today);
                scheduleTime.setHours(hours, minutes, 0, 0);

                if (scheduleTime > now) {
                    nextScheduleTime = scheduleTime;
                    break;
                }
            }

            if (!nextScheduleTime) {
                nextScheduleTime = new Date(medication.start);
                while (nextScheduleTime <= now) {
                    nextScheduleTime.setDate(nextScheduleTime.getDate() + medication.frequency);
                }

                const firstSchedule = medication.schedules[0];
                const [hours, minutes] = firstSchedule.split(':').map(Number);
                nextScheduleTime.setHours(hours, minutes, 0, 0);
            }

            await scheduleMedicationTask(medication, nextScheduleTime, agenda);
            medication.isScheduled = true;
            await medication.save();
        }
    } catch (error) {
        console.error(`Erro ao verificar e agendar medicamentos: ${error.message}`);
    }
};

const scheduleMedicationNotTakenTask = async (medicationHistory, medication, agenda) => {
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
    const jobId = `medicationNotTaken-${medicationHistory._id}-${notTakenTime}`;

    await agenda.schedule(notTakenTime, 'medication not taken', {
        medicationHistoryId: medicationHistory._id,
    }, { jobId });

    console.log(`Tarefa medication not taken agendada para ${notTakenTime}`);
};

const cancelMedicationSchedules = async (patientId, agenda) => {
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
        }
    } catch (err) {
        console.error(`Erro ao cancelar agendamentos de medicamentos: ${err.message}`);
    }
}

module.exports = { checkAndScheduleMedications, scheduleMedicationNotTakenTask, cancelMedicationSchedules }