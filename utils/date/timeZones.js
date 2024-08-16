const moment = require('moment-timezone');

const getCurrentDateInBrazilTime = () => {
    return moment().tz('America/Sao_Paulo').toDate();
};

const convertToBrazilTime = (date) => {
    const utcDate = moment.utc(date);
    const brazilTime = utcDate.tz('America/Sao_Paulo');
    console.log("Data convertido para Brazil Time <Moment>: ", brazilTime);

    return brazilTime;
};

const getStartOfTheDay = (date) => {
    return moment(date).startOf('day').toDate();
}

const getEndOfTheDay = (date) => {
    return moment(date).endOf('day').toDate();
}

const convertToUTC = (date) => {
    console.log("Data antes da conversão em UTC: ", date);
    return moment(date).utc().toDate();
};

const getExpirationDateInUTC = (date, timezone = 'America/Sao_Paulo', addDays, targetHour) => {
    const expirationDate = moment.tz(date, timezone)
        .add(addDays, 'days')
        .set({ hour: targetHour, minute: 0, second: 0, millisecond: 0 });
    return convertToUTC(expirationDate);
};

const getNextScheduleTime = (schedules, startDate, frequency, timezone = 'America/Sao_Paulo') => {
    const now = moment().tz(timezone);
    const today = moment(now).startOf('day');
    let nextScheduleTime = null;

    for (const schedule of schedules) {
        const [hours, minutes] = schedule.split(':').map(Number);
        const scheduleTimeToday = moment(today).set({ hour: hours, minute: minutes });

        if (scheduleTimeToday.isAfter(now)) {
            nextScheduleTime = scheduleTimeToday;
            break;
        }
    }

    if (!nextScheduleTime) {
        nextScheduleTime = moment(startDate).tz(timezone);
        while (nextScheduleTime.isSameOrBefore(now)) {
            nextScheduleTime.add(frequency, 'days');
        }

        const firstSchedule = schedules[0];
        const [hours, minutes] = firstSchedule.split(':').map(Number);
        nextScheduleTime.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    }

    return convertToUTC(nextScheduleTime);
};

module.exports = {
    getCurrentDateInBrazilTime,
    convertToBrazilTime,
    convertToUTC,
    getExpirationDateInUTC,
    getNextScheduleTime,
    getStartOfTheDay,
    getEndOfTheDay
};