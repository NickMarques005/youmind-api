const { DateTime } = require("luxon");
const { formatTimeLeft } = require("../../utils/date/formatDate");
const { MessageTypes } = require("../../utils/response/typeResponse");
const { PageTypes, MenuTypes, ScreenTypes } = require("../../utils/app/screenMenuTypes");
const NotificationStructure = require("../notifications/notificationStructure");
const { PatientUser } = require("../../models/users");
const Medication = require("../../models/medication");
const { getTimeLeftOfDate } = require("../../utils/date/timeZones");


const sendMedicationReminderToPatient = async (sendMedicationReminderData) => {

    try {
        const { medicationId, patientId, scheduleTime } = sendMedicationReminderData;

        console.log("#EnvioLembrete# ScheduleTime do medicamento: ", scheduleTime);
        console.log(`#EnvioLembrete# Lembrete enviado para o paciente ${patientId} sobre a medicação ${medicationId}`);

        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.error(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const medication = await Medication.findById(medicationId);
        if (!medication) {
            console.error(`Medicação não encontrada: ${medicationId}`);
            return;
        }

        const scheduleTimeLeft = getTimeLeftOfDate(scheduleTime);
        if (scheduleTimeLeft === 0) {
            console.error("O horário de tomar o medicamento já passou.");
            return;
        }

        const formattedPeriodRemaining = formatTimeLeft(scheduleTimeLeft);

        const notification = new NotificationStructure(
            'Hora de tomar seu medicamento',
            `Fique alerta! Seu medicamento ${medication.name} deve ser tomado em ${formattedPeriodRemaining}.`,
            {
                notify_type: 'treatment',
                notify_function: 'medication_alert',
                show_modal: false,
                redirect_params: {
                    screen: ScreenTypes.HEALTH_MEDICATIONS,
                    menu_option: MenuTypes.SAÚDE,
                    page: PageTypes.SAÚDE.MEDICAMENTOS
                },
                icon: MessageTypes.INFO
            }
        );

        const notificationSended = await notification.sendToPatient(patientId);
        if (!notificationSended) {
            console.log("Notificação de lembrete de medicação não enviada.");
        }

    } catch (err) {
        console.error("Erro ao enviar o lembrete de medicação para o paciente: ", err);
    }
};

module.exports = { sendMedicationReminderToPatient };