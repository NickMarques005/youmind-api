//---formatDate.js---//

const formatDateRelative = (date) => {
    const dateNow = new Date();
    const datePast = new Date(date);
    const diffInSeconds = Math.floor((dateNow - datePast) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return 'há menos de um minuto atrás';
    } else if (diffInMinutes < 60) {
        return `há ${diffInMinutes} minuto(s) atrás`;
    } else if (diffInHours < 24) {
        return `há ${diffInHours} hora(s) atrás`;
    } else if (diffInDays < 7) {
        return `há ${diffInDays} dia(s) atrás`;
    } else {
        const day = datePast.getDate().toString().padStart(2, '0');
        const month = (datePast.getMonth() + 1).toString().padStart(2, '0');
        const year = datePast.getFullYear().toString().slice(-2);
        const hours = datePast.getHours().toString().padStart(2, '0');
        const minutes = datePast.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes} de ${day}/${month}/${year}`;
    }
};


module.exports = { formatDateRelative };