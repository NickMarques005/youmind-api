const { DateTime } = require('luxon');

// Função para obter a data atual no fuso horário do Brasil
const getCurrentDateInBrazilTime = () => {
    return DateTime.now().setZone('America/Sao_Paulo').toJSDate();
};

// Função para converter uma data para o horário do Brasil
const convertDateToBrazilDate = (date) => {
    const dateToConvert = DateTime.fromJSDate(date, { zone: 'America/Sao_Paulo' });
    
    if (!dateToConvert.isValid) {
        console.error("Data inválida:", dateToConvert.invalidExplanation);
        return null;
    }
    
    console.log("Data convertida para horário do Brasil <Luxon>: ", dateToConvert.toISO());
    return dateToConvert.toJSDate();
};

// Função para obter o início do dia
const getStartOfTheDay = (date, timezone = 'America/Sao_Paulo') => {
    const startOfDay = DateTime.fromJSDate(date, { zone: timezone })
        .startOf('day')
        .toJSDate();
    
    if (!startOfDay) {
        console.error("Data inválida para início do dia");
        return null;
    }
    return startOfDay;
};

// Função para obter o final do dia
const getEndOfTheDay = (date, timezone = 'America/Sao_Paulo') => {
    const endOfDay = DateTime.fromJSDate(date, { zone: timezone })
        .endOf('day')
        .toJSDate();
    
    if (!endOfDay) {
        console.error("Data inválida para final do dia");
        return null;
    }
    return endOfDay;
};

// Função para converter uma data para UTC
const convertToUTC = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Data inválida fornecida para conversão UTC");
        return null;
    }

    const utcDate = DateTime.fromJSDate(date).toUTC().toJSDate();

    if (!utcDate || isNaN(utcDate.getTime())) {
        console.error("Erro na conversão para UTC");
        return null;
    }

    console.log("Data da conversão em UTC: ", utcDate);
    return utcDate;
};

// Função para obter a data de expiração em UTC
const getExpirationDateInUTC = (date, timezone = 'America/Sao_Paulo', addDays, targetHour) => {
    const expirationDate = DateTime.fromJSDate(date, { zone: timezone })
        .plus({ days: addDays })
        .set({ hour: targetHour, minute: 0, second: 0, millisecond: 0 });

    if (!expirationDate.isValid) {
        console.error("Data inválida ao calcular a data de expiração:", expirationDate.invalidExplanation);
        return null;
    }
    
    return convertToUTC(expirationDate.toJSDate());
};

// Função para obter o próximo horário agendado
const getNextScheduleTime = (schedules, startDate, frequency) => {
    const now = DateTime.now().setZone('America/Sao_Paulo');
    const today = now.startOf('day');
    const startOfSchedule = DateTime.fromJSDate(startDate).setZone('America/Sao_Paulo');
    let nextScheduleTime = null;

    /*
    ### Verifica se hoje é menor que a data de início do agendamento
    */
    if (now < startOfSchedule) {
        // Se for, retorna o primeiro horário do dia de início do agendamento
        const [hours, minutes] = schedules[0].split(':').map(Number);
        nextScheduleTime = startOfSchedule.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
        const firstSchedule = nextScheduleTime.toJSDate();
        console.log("### Próximo agendamento no futuro (startDate): ", firstSchedule);
        return firstSchedule;
    }

    /*
    ### Se hoje é maior ou igual à data de início, continua a lógica para calcular o próximo agendamento
    */
    for (const schedule of schedules) {

        const [hours, minutes] = schedule.split(':').map(Number);
        const scheduleTimeToday = today.set({ hour: hours, minute: minutes });

        console.log("Verificando scheduleTime para hoje: ", scheduleTimeToday);
        if (scheduleTimeToday > now) {
            nextScheduleTime = scheduleTimeToday;
            console.log(`ScheduleTime ${scheduleTimeToday} maior que agora ${now}`);
            break;
        }
    }

    /*
    ### Se não há mais horários hoje, calcula o próximo agendamento para a próxima data
    */
    if (!nextScheduleTime) {
        nextScheduleTime = startOfSchedule;
        while (nextScheduleTime <= now) {
            nextScheduleTime = nextScheduleTime.plus({ days: frequency });
        }

        const firstSchedule = schedules[0];
        const [hours, minutes] = firstSchedule.split(':').map(Number);
        nextScheduleTime = nextScheduleTime.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    }

    const nextSchedule = nextScheduleTime.toJSDate();
    console.log("### NOVA DATA DE SCHEDULE: ", nextSchedule);
    return nextSchedule;
};

const getTimeLeftOfDate = (date) => {
    const now = DateTime.now(); 
    const scheduled = DateTime.fromJSDate(date);
    const duration = scheduled.diff(now).milliseconds;
    
    if (duration < 0) {
        return 0;
    }
    
    return duration;
};

const setDateToSpecificTime = (date, timeString) => {
    if (!date || !timeString) {
        console.error("Data ou horário não fornecido");
        return null;
    }

    const startOfDay = DateTime.fromJSDate(date).setZone('America/Sao_Paulo').startOf('day');
    const [hours, minutes] = timeString.split(':').map(Number);

    const dateWithTime = startOfDay.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    if (!dateWithTime.isValid) {
        console.error("Erro ao ajustar a data e hora:", dateWithTime.invalidExplanation);
        return null;
    }

    console.log("Data especifica: ", dateWithTime);

    return dateWithTime.toJSDate();
}

const subtractDaysFromDate = (date, days) => {
    return DateTime.fromJSDate(date)
    .minus({ days: days })
    .toJSDate();
}


module.exports = {
    getCurrentDateInBrazilTime,
    getExpirationDateInUTC,
    getNextScheduleTime,
    getStartOfTheDay,
    getEndOfTheDay,
    getTimeLeftOfDate,
    convertDateToBrazilDate,
    convertToUTC,
    setDateToSpecificTime,
    subtractDaysFromDate,
};