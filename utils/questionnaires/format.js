const { getCurrentDateInBrazilTime } = require("../date/timeZones");

const getFormattedQuestionnaireName = () => {
    const currentDate = getCurrentDateInBrazilTime();

    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return `Questionário de ${formattedDate}`;
};

module.exports = { getFormattedQuestionnaireName };