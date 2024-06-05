const { Agenda } = require('@hokify/agenda');
const defineAgendaTasks = require('./defines/main_defines');
const dbURI = process.env.MONGO_URI;
const cronIntervals = require('../utils/agenda/intervals');

const agenda = new Agenda({ db: { address: dbURI, collection: 'agendaJobs' } });

defineAgendaTasks(agenda);

(async function() {
    await agenda.start();
    await agenda.every(cronIntervals['diariamente às 4h da manhã'], 'send daily questionnaires');
})();

async function finishAgenda() {
    await agenda.stop();
    process.exit(0);
}

process.on('SIGTERM', finishAgenda);
process.on('SIGINT', finishAgenda);

module.exports = agenda;