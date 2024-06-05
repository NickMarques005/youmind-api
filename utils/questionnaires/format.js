const getFormattedQuestionnaireName = () => {
    const currentDate = new Date();

    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return `Questionário de ${formattedDate}`;
};

module.exports = { getFormattedQuestionnaireName };