const cronIntervals = {
    'a cada 5 minutos': '*/5 * * * *',
    'a cada 10 segundos': '*/10 * * * * *',
    'a cada 1 hora': '0 * * * *',
    'a cada 3 horas': '0 */3 * * *',
    'a cada 2 minutos': '*/2 * * * *',
    'diariamente às 4h da manhã': '0 4 * * *',
};

module.exports = cronIntervals;