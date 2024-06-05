const Medication = require('../models/medication');
const { scheduleMedicationTask } = require('../agenda/defines/medications');
const agenda = require('../agenda/agenda_config');

const checkAndScheduleMedications = async (patientId) => {
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

module.exports = { checkAndScheduleMedications, scheduleMedicationNotTakenTask }