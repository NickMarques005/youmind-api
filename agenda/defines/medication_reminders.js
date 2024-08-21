const { scheduleNewReminderTask } = require("../../services/medications/reminderScheduler");
const { sendMedicationReminderToPatient } = require("../../services/medications/reminderService");
const { cancelSpecificTask } = require("../../utils/agenda/cancel");

const handleReminderSchedule = async (job, agenda) => {
    try {
        const { medicationId, patientId, scheduleTime, nextReminderDates } = job.attrs.data;
        /*
        ### Envia a notificação de lembrete ao paciente
        */
        await sendMedicationReminderToPatient({ medicationId, patientId, scheduleTime });

        /*
        ### Cancela o último agendamento executado
        */
        const taskId = job.attrs._id;
        await cancelSpecificTask(taskId, agenda);

        /*
        ### Diminuir o array de lembretes retirando o último que foi agendado, e então reagendar o lembrete se existir próxima data:
        */

        //Retira a primeira data da lista de nextReminderDates que já foi usada
        let newReminderDates = nextReminderDates.slice(1);

        //Se houver ainda datas em na nova lista de datas dos lembretes então executa o próximo agendamento
        if (newReminderDates && newReminderDates.length > 0) {
            await scheduleNewReminderTask({
                medicationId,
                patientId,
                nextReminderDates: newReminderDates,
            }, agenda);
        }
        else{
            console.log("#Lembretes# Não há mais lembretes a seem enviados!");
        }

    } catch (error) {
        console.error("#Erro# Ocorreu um erro ao executar handleReminderTask: ", error);
    }
};

module.exports = { handleReminderSchedule };