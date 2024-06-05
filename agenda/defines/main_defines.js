const { rescheduleMedication, medicationNotTaken } = require('./medications');
const { sendDailyQuestionnaires } = require('./questionnaires');

const defineAgendaTasks = (agenda) => {

    agenda.define('send daily questionnaires', sendDailyQuestionnaires);
    agenda.define('send medication alert', async (job) => {
        await rescheduleMedication(job, agenda);
    });
    agenda.define('medication not taken', async (job) => {
        await medicationNotTaken(job, agenda);
    })
};

module.exports = defineAgendaTasks;