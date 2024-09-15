

const verifyUnansweredQuestionnaire = (questionnaire) => {
    const expiredAt = questionnaire.expiredAt;
    const now = new Date();

    const isUnchecked = questionnaire.checked === false;
    const isBeforeExpiration = expiredAt ? now < new Date(expiredAt) : false;

    return isBeforeExpiration && isUnchecked;
}

module.exports = { verifyUnansweredQuestionnaire }