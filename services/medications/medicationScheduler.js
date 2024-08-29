const Medication = require('../../models/medication');
const { getNextScheduleTime, setDateToSpecificTime, subtractDaysFromDate } = require('../../utils/date/timeZones');
const agendaDefines = require('../../utils/agenda/defines');
const { createNewMedicationHistory } = require('./medicationService');
const { initializeScheduleReminders } = require('./reminderScheduler');

const scheduleMedicationTask = async (medication, scheduleTime, agenda) => {
    try {
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o agendamento do medicamento");
            return;
        }
        const medicationHistory = await createNewMedicationHistory(medication, scheduleTime);

        const jobId = `medication-${medication._id}-${scheduleTime}`;
        console.log(`Próximo alerta de medicamento ${medication.name} será em ${scheduleTime}`);
        await agenda.schedule(scheduleTime, agendaDefines.SEND_MEDICATION_ALERT, {
            medicationHistoryId: medicationHistory._id,
            patientId: medication.patientId,
            medicationId: medication._id
        }, { jobId });

        /*
        ### Se o agendamento de send medication alert funcionar, fazer o início do agendamento de lembretes para esse medicamento:
        */
        await initializeScheduleReminders(medication, scheduleTime, agenda);
    }
    catch (err) {
        console.error("Houve um erro ao agendar o medicamento: ", err);
    }
}

const initializeMedicationScheduleProcess = async (medication, agenda) => {
    try {
        /*
        ### Primeiro agendamento do medicamento
        */
        const firstScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency);
        await scheduleMedicationTask(medication, firstScheduleTime, agenda);

        /*
        ### Agendamento do último dia do medicamento
        */
        await initializeScheduleLastDayReminder(medication, agenda);

        return true;
    }
    catch (err) {
        console.error("Houve um erro ao iniciar agendamento: ", err);
        return false;
    }

}

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

        if (unscheduledMedications.length === 0) {
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
    try {
        console.log("\n*****\n");
        console.log("Medication Not Taken Task: \n");
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamento não tomado.");
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

        await agenda.schedule(notTakenTime, agendaDefines.SEND_MEDICATION_NOT_TAKEN, {
            medicationHistoryId: medicationHistory._id,
        }, { jobId });

        console.log(`Tarefa medication not taken agendada para ${notTakenTime}`);
        console.log("\n*****\n");
    }
    catch (err) {
        console.error("Houve um erro no agendamento de medicamento Not Taken: ", err);
    }
};

const cancelSpecificMedicationSchedules = async (medicationId, agenda) => {
    try {
        console.log("Cancelamento de todos os agendamentos do medicamento");
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o cancelamento dos agendamentos de medicamento");
            return;
        }

        const canceledAlerts = await agenda.cancel({ name: agendaDefines.SEND_MEDICATION_ALERT, 'data.medicationId': medicationId });
        const canceledNotTaken = await agenda.cancel({ name: agendaDefines.SEND_MEDICATION_NOT_TAKEN, 'data.medicationId': medicationId });
        const canceledLastDay = await agenda.cancel({ name: agendaDefines.LAST_DAY_MEDICATION_REMINDER, 'data.medicationId': medicationId });
        const canceledReminders = await agenda.cancel({ name: agendaDefines.SEND_MESSAGE_REMINDER, 'data.medicationId': medicationId });
        console.log("Agendamentos cancelados!");

        canceledAlerts > 0 ?
            console.log("Agendamentos alerta cancelados!") :
            console.warn("Nenhum agendamento alerta foi cancelado.");

        canceledNotTaken > 0 ?
            console.log("Agendamentos not taken cancelados!") :
            console.log("Nenhum agendamento not taken foi cancelado.");

        canceledLastDay > 0 ?
            console.log("Agendamento de último dia cancelado!") :
            console.log("Nenhum agendamento de último dia foi cancelado.");

        canceledReminders > 0 ?
            console.log("Agendamentos de lembretes cancelados!") :
            console.log("Nenhum agendamento de lembrete foi cancelado.");

        return { canceledAlerts, canceledNotTaken, canceledLastDay, canceledReminders };
    }
    catch (err) {
        console.error("Houve um erro ao cancelar todos os agendamentos do medicamento: ", err);
    }
}

const cancelSpecificMedicationNotTakenSchedule = async (medicationHistoryId, agenda) => {
    try {
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o cancelamento do agendamento not Taken");
            return;
        }
        const canceledNotTaken = await agenda.cancel({ name: agendaDefines.SEND_MEDICATION_NOT_TAKEN, 'data.medicationHistoryId': medicationHistoryId });

        if (canceledNotTaken > 0) {
            console.log("Agendamentos not taken cancelados!");
        }
        else {
            console.log("Nenhum agendamento not taken foi cancelado.");
        }
    }
    catch (err) {
        console.log("Houve um erro ao cancelar medicação especifica: ", err);
    }
}

const cancelAllMedicationSchedules = async (patientId, agenda) => {
    try {
        console.log("\n*****\n");
        console.log("Cancelamento dos agendamentos de medicações: \n");
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o agendamento de medicamentos.");
            return;
        }

        const medications = await Medication.find({ patientId: patientId });
        if (!medications || medications.length === 0) {
            console.log("Nenhum medicamento encontrado para o paciente");
            return;
        }

        for (const medication of medications) {
            const canceledAlerts = await agenda.cancel({ name: agendaDefines.SEND_MEDICATION_ALERT, 'data.medicationId': medication._id });
            const canceledNotTaken = await agenda.cancel({ name: agendaDefines.SEND_MEDICATION_NOT_TAKEN, 'data.medicationId': medication._id });
            const canceledLastDay = await agenda.cancel({ name: agendaDefines.LAST_DAY_MEDICATION_REMINDER, 'data.medicationId': medication._id });
            const canceledReminders = await agenda.cancel({ name: agendaDefines.SEND_MESSAGE_REMINDER, 'data.medicationId': medication._id });

            canceledAlerts > 0 ?
                console.log("Agendamentos alerta cancelados!") :
                console.warn("Nenhum agendamento alerta foi cancelado.");

            canceledNotTaken > 0 ?
                console.log("Agendamentos not taken cancelados!") :
                console.log("Nenhum agendamento not taken foi cancelado.");

            canceledLastDay > 0 ?
                console.log("Agendamento de último dia cancelado!") :
                console.log("Nenhum agendamento de último dia foi cancelado.");

            canceledReminders > 0 ?
                console.log("Agendamentos de lembretes cancelados!") :
                console.log("Nenhum agendamento de lembrete foi cancelado.");

            // Atualiza o status do medicamento para refletir o cancelamento do agendamento
            medication.isScheduled = false;
            medication.expiresAt = undefined;
            medication.start = undefined;
            medication.frequency = undefined;
            medication.schedules = [];
            await medication.save();
            console.log("\n*****\n");
        }
    } catch (err) {
        console.error(`Erro ao cancelar agendamentos de medicamentos: ${err.message}`);
    }
}

const initializeScheduleLastDayReminder = async (medication, agenda) => {
    try {
        if (!agenda) {
            console.warn("Agenda não inicializada, não foi possível verificar o agendamento do último dia do medicamento");
            return;
        }
        const { _id, patientId, expiresAt, schedules } = medication;

        const now = new Date();
        // Hora do último agendamento do dia de expiração
        const lastScheduleTime = schedules[schedules.length - 1];
        const lastScheduleOnExpirationDay = setDateToSpecificTime(expiresAt, lastScheduleTime);
        const timeDifferenceInDays = (lastScheduleOnExpirationDay - now) / (1000 * 60 * 60 * 24);

        /*
        ### Verifica se a diferença entre a data atual e a data do último medicamento é maior que um dia
        */

        if (timeDifferenceInDays > 1) {
            // Subtrai um dia do último agendamento para determinar o horário do lembrete de último dia
            const reminderLastDayTime = subtractDaysFromDate(lastScheduleOnExpirationDay, 1);

            console.log("#UltimoDiaMedicamento# Schedule em que será enviado o lembrete de último dia: ", reminderLastDayTime);

            const jobId = `last-day-reminder-${_id}`;
            await agenda.schedule(reminderLastDayTime, agendaDefines.LAST_DAY_MEDICATION_REMINDER, {
                medicationId: _id,
                patientId,
                expiresAt
            }, { jobId });
            console.log(`#UltimoDiaMedicamento# Agendado para o último dia do medicamento ${_id}: ${reminderLastDayTime} `);
        }
        else {
            console.log(`#UltimoDiaMedicamento# O lembrete de último dia não foi agendado porque a diferença entre hoje e o último agendamento é menor ou igual a um dia.`);
        }
    }
    catch (err) {
        console.error("Erro ao iniciar agendamento de último agendamento: ", err);
    }
}

module.exports = {
    scheduleMedicationTask,
    checkAndScheduleMedications,
    scheduleMedicationNotTakenTask,
    cancelAllMedicationSchedules,
    cancelSpecificMedicationSchedules,
    cancelSpecificMedicationNotTakenSchedule,
    initializeScheduleLastDayReminder,
    initializeMedicationScheduleProcess
}