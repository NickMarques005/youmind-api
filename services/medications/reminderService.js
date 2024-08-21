

const sendMedicationReminderToPatient = async (sendMedicationReminderData) => {
    try {
        const { medicationId, patientId, scheduleTime } = sendMedicationReminderData;

        console.log("#EnvioLembrete# ScheduleTime do medicamento: ", scheduleTime);
        console.log(`#EnvioLembrete# Lembrete enviado para o paciente ${patientId} sobre a medicação ${medicationId}`);

    } catch (error) {
        console.error("#Erro# Ocorreu um erro ao enviar o lembrete para o paciente: ", error);
    }
};

module.exports = { sendMedicationReminderToPatient };