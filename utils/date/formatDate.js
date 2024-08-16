const { DateTime } = require('luxon');

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

// Função para formatar a data em ISO considerando o fuso horário do Brasil
const formatDateToISO = (date) => {
    const brazilTime = DateTime.fromJSDate(date).setZone('America/Sao_Paulo');
    return brazilTime.toISO();
};

// Função para formatar uma data ISO para horas no fuso horário do Brasil
const formatISOToHours = (dateIso) => {
    const brazilTime = DateTime.fromISO(dateIso).setZone('America/Sao_Paulo');
    return brazilTime.toFormat('HH:mm');
};


module.exports = { formatDateRelative, formatTimeLeft, formatDateToISO, formatISOToHours };