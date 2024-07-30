const { getCurrentDateInBrazilTime } = require("../date/timeZones");

const getFormattedQuestionnaireName = (timeSlot) => {
    const currentDate = getCurrentDateInBrazilTime();

    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return `Questionário ${timeSlot} de ${formattedDate}`;
};

module.exports = { getFormattedQuestionnaireName };