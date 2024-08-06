const { Agenda } = require('@hokify/agenda');
const defineAgendaTasks = require('./defines/main_defines');
const cronIntervals = require('../utils/agenda/intervals');

let agenda;

const initializeAgenda = async (dbURI) => {
    agenda = new Agenda({ db: { address: dbURI, collection: 'agendaJobs' } });
    defineAgendaTasks(agenda);

    await agenda.start();

    //Agendamento de questionários matutinos:
    //await agenda.every(cronIntervals['diariamente às 6h da manhã'], 'send daily questionnaires morning', {}, { timezone: 'America/Sao_Paulo' });
    //Agendamento de questionários noturnos:
    await agenda.every(cronIntervals['diariamente às 8h da noite'], 'send daily questionnaires evening', {}, { timezone: 'America/Sao_Paulo' });

    process.on('SIGTERM', async () => {
        await finishAgenda();
    });

    process.on('SIGINT', async () => {
        await finishAgenda();
    });
}

const finishAgenda = async () => {
    if (agenda) {
        await agenda.stop();
    }
    process.exit(0);
}

const getAgenda = () => {
    return agenda || null;
}

module.exports = { 
    initializeAgenda,
    getAgenda
};