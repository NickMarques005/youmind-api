const { DateTime } = require("luxon");

const getFormattedQuestionnaireName = (timeSlot) => {
    const currentDate = DateTime.now().setZone('America/Sao_Paulo');
    const formattedDate = currentDate.toFormat("cccc, dd 'de' LLLL", { locale: 'pt-BR' });

    return `Questionário ${timeSlot} de ${formattedDate}`;
};

module.exports = { getFormattedQuestionnaireName };