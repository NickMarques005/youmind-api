/*
### Função para agendar uma tarefa específica 
*/

const scheduleTask = async (scheduleData, agenda) => {
    const { scheduleTime, define, data, jobId } = scheduleData;

    await agenda.schedule(scheduleTime, define, data, { jobId });
}

module.exports = { scheduleTask }