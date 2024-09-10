
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
    let unansweredCount = 0;

    questionnaireHistories.forEach((history) => {
        if (history.questionnaire.answered === true) {
            const performance = calculatePerformance(history.questionnaire.answers || []);
            totalPerformance += performance;
            performanceCount += 1;
        } else {
            unansweredCount += 1;
        }
    });

    const totalQuestionnaires = questionnaireHistories.length;
    const penaltyFactor = (unansweredCount / totalQuestionnaires) * 100;
    
    //Média do desempenho
    const averagePerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0;
    // Ajusta o desempenho final pela penalidade
    const performanceAfterPenalty = averagePerformance * (1 - (penaltyFactor / 100));
    
    // Garante que o desempenho esteja entre 0 e 100
    return Math.min(100, Math.max(0, performanceAfterPenalty));
}

module.exports = { calculatePerformance, calculateQuestionnairePerformance }