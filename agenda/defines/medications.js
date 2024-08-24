const Medication = require('../../models/medication');
const { medicationsQueueUrl } = require('../../aws/sqs/sqs_queues');
const { sendMessage } = require('../../aws/services/sqs_service');
const { PatientMedicationHistory } = require('../../models/patient_history');
const { getNextScheduleTime } = require('../../utils/date/timeZones');
const { scheduleMedicationTask } = require('../../services/medications/medicationScheduler');
const { sendLastDayMedicationReminder, endMedication } = require('../../services/medications/medicationService');
const { cancelSpecificTask } = require('../../utils/agenda/cancel');

const handleSendMedicationAlertSchedule = async (job, agenda) => {
    /*
    ### Envia mensagem para a fila SQS poder tratar e enviar o alerta
    */
    const { medicationId, patientId, medicationHistoryId } = job.attrs.data;

    const messageBody = {
        medicationId,
        medicationHistoryId,
        patientId,
    };

    await sendMessage(medicationsQueueUrl, messageBody);
    /*
    ### Cancelar agendamento para remove-lo e adicionar um novo agendamento se houver reagendamento
    */
    const taskId = job.attrs._id;
    await cancelSpecificTask(taskId, agenda);

    const medication = await Medication.findById(medicationId);

    if (!medication) {
        console.error(`Medicação não encontrada: ${medicationId}`);
        return;
    }
    /*
    ### Busca a próxima data do alerta para tomar o medicamento
    */
    const nextScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency);

    /*
    ### Verificação do último dia de agendamento
    */
    if (medication.expiresAt && medication.expiresAt < nextScheduleTime) {
        return console.log(`A medicação ${medication.name} chegou ao seu último agendamento e foi encerrado:\n Encerramento: ${medication.expiresAt} / Suposto próximo agendamento: ${nextScheduleTime}`);
    }

    /*
    ### (Reagendamento) Se existir próxima data de agendamento então reagenda o medicamento para a próxima data
    */
    if (nextScheduleTime) {
        await scheduleMedicationTask(medication, nextScheduleTime, agenda);
    }
}

const handleMedicationNotTakenSchedule = async (job, agenda) => {
    /*
    ### Atualiza o histórico atual desse medicamento para não tomado
    */
    try {
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

        /*
        ### Cancela para remover o agendamento já executado
        */
        const taskId = job.attrs._id;
        await cancelSpecificTask(taskId, agenda);
    }
    catch (err) {
        console.error("Houve um erro ao agendar a medicação not taken: ", err);
    }

}

const handleSendLastDayMedicationReminderSchedule = async (job, agenda) => {
    try {
        const { medicationId, patientId, expiresAt } = job.attrs.data.Medication;

        /*
        ### Cancelar último agendamento executado
        */
        const taskId = job.attrs._id;
        await cancelSpecificTask(taskId, agenda);

        //Manda mensagem notificação para o paciente:
        await sendLastDayMedicationReminder({ medicationId, patientId, expiresAt });
    }
    catch (err) {
        console.error("Houve um erro ao agendar lembrete do último dia da medicação: ", err);
    }
}

module.exports = {
    handleSendMedicationAlertSchedule,
    handleMedicationNotTakenSchedule,
    handleSendLastDayMedicationReminderSchedule
}