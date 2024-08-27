const { DateTime } = require("luxon");

const getFormattedQuestionnaireName = (timeSlot) => {
    const currentDate = DateTime.now().setZone('America/Sao_Paulo');

    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return `Questionário ${timeSlot} de ${formattedDate}`;
};

module.exports = { getFormattedQuestionnaireName };