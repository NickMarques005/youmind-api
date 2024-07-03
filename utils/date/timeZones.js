const moment = require('moment-timezone');

const getCurrentDateInBrazilTime = () => {
    return moment().tz('America/Sao_Paulo').toDate();
};

const convertToBrazilTime = (date) => {
    return moment(date).tz('America/Sao_Paulo').toDate();
};

const convertToUTC = (date) => {
    return moment(date).utc().toDate();
};

module.exports = {
    getCurrentDateInBrazilTime,
    convertToBrazilTime,
    convertToUTC
};