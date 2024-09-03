const cronIntervals = {
    'a cada 5 minutos': '*/5 * * * *',
    'a cada 10 segundos': '*/10 * * * * *',
    'a cada 1 hora': '0 * * * *',
    'a cada 3 horas': '0 */3 * * *',
    'a cada 2 minutos': '*/2 * * * *',
    'diariamente à meia noite': '0 0 * * *',
    'diariamente às 2h da manhã': '0 2 * * *',
    'diariamente às 4h da manhã': '0 4 * * *',
    'diariamente às 6h da manhã': '0 6 * * *',
    'diariamente às 8h da noite': '0 20 * * *'
};

module.exports = cronIntervals;