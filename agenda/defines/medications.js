const Medication = require('../../models/medication');
const { medicationsQueueUrl } = require('../../aws/sqs/sqs_queues');
const { sendMessage } = require('../../aws/services/sqs_service');
const { PatientMedicationHistory } = require('../../models/patient_history');
const { createNewMedicationHistory } = require('../../services/medications/medicationService');

const scheduleMedicationTask = async (medication, scheduleTime, agenda) => {
    
    const medicationHistory = await createNewMedicationHistory(medication._id, medication.patientId, scheduleTime);

    const jobId = `medication-${medication._id}-${scheduleTime}`;
    console.log(`Próximo alerta de medicamento ${medication.name} será em ${scheduleTime}`);
    await agenda.schedule(scheduleTime, 'send medication alert', {
        medicationHistoryId: medicationHistory._id,
        patientId: medication.patientId,
        medicationId: medication._id
    }, { jobId });
}

const rescheduleMedication = async (job, agenda) => {
    const { medicationId, patientId, medicationHistoryId } = job.attrs.data;

    const messageBody = {
        medicationId,
        medicationHistoryId,
        patientId,
    };

    await sendMessage(medicationsQueueUrl, messageBody);

    await agenda.cancel({ _id: job.attrs._id });

    const medication = await Medication.findById(medicationId);

    if (!medication) {
        console.error(`Medicação não encontrada: ${medicationId}`);
        return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let nextScheduleTime = null;

    const validSchedule = medication.schedules.find(schedule => {
        const [hours, minutes] = schedule.split(':').map(Number);
        const scheduleTime = new Date(today);
        scheduleTime.setHours(hours, minutes, 0, 0);

        return scheduleTime > now;
    });

    if (validSchedule) {
        console.log("Schedule Válido ainda hoje!");
        const [hours, minutes] = validSchedule.split(':');
        nextScheduleTime = new Date(today);
        nextScheduleTime.setHours(hours, minutes, 0, 0);
    } else {
        console.log("Schedule para próximo dia!");
        let nextDay = new Date(medication.start);
        while (nextDay <= today) {
            nextDay.setDate(nextDay.getDate() + medication.frequency);
        }

        const firstSchedule = medication.schedules[0];
        const [hours, minutes] = firstSchedule.split(':');
        nextDay.setHours(hours, minutes, 0, 0);
        nextScheduleTime = nextDay;
    }

    if (nextScheduleTime) {
        await scheduleMedicationTask(medication, nextScheduleTime, agenda);
    }
}

const medicationNotTaken = async (job, agenda) => {
    const { medicationHistoryId } = job.attrs.data;

    const currentMedicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);

    if (!currentMedicationHistory) {
        console.error(`Histórico de medicação não encontrado: ${medicationHistoryId}`);
        return;
    }

    currentMedicationHistory.medication.alert = false;
    currentMedicationHistory.medication.pending = false;
    currentMedicationHistory.medication.taken = false;

    await currentMedicationHistory.save();
    console.log(`Medicação não tomada registrada para ${medicationHistoryId}`);

    await agenda.cancel({ _id: job.attrs._id });
}

module.exports = { scheduleMedicationTask, rescheduleMedication, medicationNotTaken }