const agendaDefines = require('../../utils/agenda/defines');
const { handleReminderSchedule } = require('./medication_reminders');
const { handleSendMedicationAlertSchedule, handleMedicationNotTakenSchedule, handleSendLastDayMedicationReminderSchedule } = require('./medications');
const { handleSendDailyQuestionnairesMorning, handleSendDailyQuestionnairesEvening } = require('./questionnaires');

const defineAgendaTasks = (agenda) => {

    agenda.define(agendaDefines.SEND_DAILY_QUESTIONNAIRES_MORNING, handleSendDailyQuestionnairesMorning);
    agenda.define(agendaDefines.SEND_DAILY_QUESTIONNAIRES_EVENING, handleSendDailyQuestionnairesEvening);
    agenda.define(agendaDefines.SEND_MEDICATION_ALERT, async (job) => {
        await handleSendMedicationAlertSchedule(job, agenda);
    });
    agenda.define(agendaDefines.SEND_MEDICATION_NOT_TAKEN, async (job) => {
        await handleMedicationNotTakenSchedule(job, agenda);
    });
    agenda.define(agendaDefines.SEND_MESSAGE_REMINDER, async (job) => {
        await handleReminderSchedule(job, agenda);
    });
    agenda.define(agendaDefines.LAST_DAY_MEDICATION_REMINDER, async (job) => {
        await handleSendLastDayMedicationReminderSchedule(job, agenda);
    });
};

module.exports = defineAgendaTasks;