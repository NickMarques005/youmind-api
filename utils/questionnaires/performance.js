
const calculatePerformance = (answers) => {
    const performanceValues = {
        precisa_melhorar: 1,
        ruim: 2,
        bom: 3,
        ótimo: 4,
        excelente: 5
    };

    let totalValue = 0;
    let answerCount = 0;

    answers.forEach(answer => {
        if (answer.type) {
            totalValue += performanceValues[answer.type];
            answerCount += 1;
        }

        if (answer.subAnswers && answer.subAnswers.length > 0) {
            answer.subAnswers.forEach(subAnswer => {
                if (subAnswer.type) {
                    totalValue += performanceValues[subAnswer.type];
                    answerCount += 1;
                }
            });
        }
    });

    if (answerCount === 0) return 0;

    const averageValue = totalValue / answerCount;

    return (averageValue / 5) * 100; 
}

const calculateQuestionnairePerformance = (questionnaireHistories) => {
    let totalPerformance = 0;
    let performanceCount = 0;

    /*
    ### Fator de atenuação para desempenhos iniciais
    */
    const dampingFactor = 0.5;

    questionnaireHistories.forEach((history, index) => {
        const progressFactor = 1 + (dampingFactor * index / questionnaireHistories.length);

        if (history.questionnaire.answered === true) {
            const performance = calculatePerformance(history.questionnaire.answers || []);
            const effectivePerformance = performance * progressFactor;
            totalPerformance += effectivePerformance;
            performanceCount += 1;
        } else {
            const penalty = 2 * progressFactor;
            totalPerformance -= penalty;
        }
    });

    return performanceCount > 0 ? totalPerformance / performanceCount : 0;
}

module.exports = { calculatePerformance, calculateQuestionnairePerformance }