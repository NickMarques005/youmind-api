const moment = require('moment-timezone');

const formatDateRelative = (date) => {
    const dateNow = new Date();
    const datePast = new Date(date);
    const diffInSeconds = Math.floor((dateNow - datePast) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return 'menos de um minuto atrás';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minuto(s) atrás`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hora(s) atrás`;
    } else if (diffInDays < 7) {
        return `${diffInDays} dia(s) atrás`;
    } else {
        const day = datePast.getDate().toString().padStart(2, '0');
        const month = (datePast.getMonth() + 1).toString().padStart(2, '0');
        const year = datePast.getFullYear().toString().slice(-2);
        const hours = datePast.getHours().toString().padStart(2, '0');
        const minutes = datePast.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes} de ${day}/${month}/${year}`;
    }
};

const formatTimeLeft = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        if (remainingMinutes > 0) {
            return `${hours} hora(s) e ${remainingMinutes} minuto(s)`;
        } else {
            return `${hours} hora(s)`;
        }
    } else {
        return `${minutes} minuto(s)`;
    }
}

const formatMomentToISO = (date) => {
    const brazilTime = moment.tz(date, 'America/Sao_Paulo');
    const formattedDate = brazilTime.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    return formattedDate;
}

const formatISOToHours = (dateIso) => {
    const brazilTime = moment.tz(dateIso, 'America/Sao_Paulo');
    const formattedTime = brazilTime.format('HH:mm');
    return formattedTime;
}


module.exports = { formatDateRelative, formatTimeLeft, formatMomentToISO, formatISOToHours };