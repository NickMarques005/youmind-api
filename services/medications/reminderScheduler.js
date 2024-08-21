const agendaDefines = require("../../utils/agenda/defines");

const scheduleNewReminderTask = async (scheduleReminderData, agenda) => {
    if (!agenda) {
        console.warn("Agenda não inicializada, não foi possível verificar o agendamento de lembrete do medicamento.");
        return;
    }
    const {medicationId, patientId, scheduleTime, nextReminderDates } = scheduleReminderData;

    if (nextReminderDates.length > 0) {
        const reminderTime = nextReminderDates.shift();

        if (reminderTime) {

            const jobId = `reminder-${scheduleReminderData.medicationId}-${reminderTime}`;
            await agenda.schedule(reminderTime, agendaDefines.SEND_MESSAGE_REMINDER, {
                medicationId,
                patientId,
                scheduleTime,
                nextReminderDates: nextReminders.length !== 0 ? nextReminders : []
            }, { jobId });
            return;
        }

        console.log("#Lembrete# Data do agendamento do lembrete retornou undefined..");
    }
    else {
        console.log(`#Lembrete# Não há mais lembretes para serem enviados ao ${scheduleReminderData.medicationId}###`);
    }
}

const reminderSchedulesVerification = async (medicationScheduleTime, reminderTimes) => {
    if (!reminderTimes) {
        throw new Error("Houve um erro na verificação de lembretes: reminderTimes retornou undefined");
    }

    //Verificando a diferença do periodo entre o agendamento do medicamento e o horário atual
    const reminders = [];
    const reminderInterval = 5 * 60 * 1000; // Intervalo de 5 minutos em milissegundos

    const now = new Date();
    const timeDifference = medicationScheduleTime - now;
    if (timeDifference <= 0) {
        return []; // Se o tempo já passou, não há lembretes a serem agendados
    }

    if (timeDifference < reminderInterval) {
        /*
        ### Se o timeDifference for menor que o reminderInterval, enviar um lembrete no meio do intervalo
        */
        const reminderTime = new Date(now.getTime() + timeDifference / 2);
        reminders.push(reminderTime);
    } else {
        /*
        ### Adicionar os intervalos de tempo para cada lembrete dentro do período entre a data atual e a data do alerta para tomar o medicamento
        */
        const maxReminders = Math.floor(timeDifference / reminderInterval);

        for (let i = 1; i <= maxReminders && i <= reminderTimes; i++) {
            const reminderTime = new Date(medicationScheduleTime - i * reminderInterval);
            reminders.push(reminderTime);
        }
    }

    /*
    ### Inverte a lista dos intervalos para que estejam em ordem crescente de tempo
    */
    const sortedReminderTimes = reminders.reverse();
    console.log("#Lembretes# Horários de lembretes salvos após verificação: ", sortedReminderTimes);
    return sortedReminderTimes;
}

const initializeScheduleReminders = async (medication, scheduleTime, agenda) => {
    const reminderTimes = medication.reminderTimes;
    const nextReminderDates = await reminderSchedulesVerification(scheduleTime, reminderTimes);

    if (nextReminderDates.length > 0) {
        await scheduleNewReminderTask({
            medicationId: medication._id,
            patientId: medication.patientId,
            scheduleTime,
            nextReminderDates
        }, agenda);
    }
};

module.exports = { initializeScheduleReminders, scheduleNewReminderTask };