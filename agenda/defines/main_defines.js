const { rescheduleMedication, medicationNotTaken } = require('./medications');
const { sendDailyQuestionnairesMorning, sendDailyQuestionnairesEvening } = require('./questionnaires');

const defineAgendaTasks = (agenda) => {

    agenda.define('send daily questionnaires morning', sendDailyQuestionnairesMorning);
    agenda.define('send daily questionnaires evening', sendDailyQuestionnairesEvening);
    agenda.define('send medication alert', async (job) => {
        await rescheduleMedication(job, agenda);
    });
    agenda.define('medication not taken', async (job) => {
        await medicationNotTaken(job, agenda);
    });
};

module.exports = defineAgendaTasks;