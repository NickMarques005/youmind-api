const Medication = require('../../models/medication');
const { PatientMedicationHistory } = require('../../models/patient_history');
const Treatment = require('../../models/treatment');
const { PatientUser } = require('../../models/users');
const { PageTypes, ScreenTypes, MenuTypes } = require('../../utils/app/screenMenuTypes');
const { formatDateToISO, formatISOToHours } = require('../../utils/date/formatDate');
const { convertDateToBrazilDate } = require('../../utils/date/timeZones');
const { MessageTypes } = require('../../utils/response/typeResponse');
const NotificationStructure = require('../notifications/notificationStructure');

const createNewMedicationHistory = async (medication, scheduleTime) => {
    try {
        const medicationId = medication._id;
        const patientId = medication.patientId;
        const treatment = await Treatment.findOne({patientId: patientId});
        if(!treatment) return console.error("Usuário não está em tratamento no momento");
        
        console.log("MedicationHistory Criação: ");
        console.log(scheduleTime);

        const timeZoneScheduleMoment = convertDateToBrazilDate(scheduleTime);
        const scheduleISO = formatDateToISO(timeZoneScheduleMoment);
        const currentSchedule = formatISOToHours(scheduleISO);

        const newMedicationHistory = await PatientMedicationHistory.create({
            patientId: patientId,
            medication: {
                medicationId: medicationId,
                currentSchedule: currentSchedule,
                consumeDate: scheduleTime,
                name: medication.name,
                dosage: medication.dosage,
                type: medication.type,
                frequency: medication.frequency,
                start: medication.start,
                expiresAt: medication.expiresAt,
                schedules: medication.schedules,
                alarmDuration: medication.alarmDuration,
                reminderTimes: medication.reminderTimes
            },
            treatmentId: treatment._id,
        });

        return newMedicationHistory;
    } catch (err) {
        console.error(`Erro ao criar novo histórico de medicamento: ${err.message}`);
        throw err;
    }
}

const updateMedicationHistoryToAlert = async (medicationHistoryId) => {
    try {
        console.log("**Atualizar medicamento para Alert!!**");
        const updatedMedicationHistory = await PatientMedicationHistory.findByIdAndUpdate(
            medicationHistoryId,
            { $set: { 'medication.alert': true } },
            { new: true } 
        );
        return updatedMedicationHistory;
    } catch (err) {
        console.error(`Erro ao atualizar medicamento: ${err.message}`);
        throw err;
    }
}

const endMedication = async (medication) => {
        console.log(`Medicação ${medication.name} expirou, não será reagendada e será excluída.`);
        await Medication.findByIdAndDelete(medication._id);
        return;
}

const sendLastDayMedicationReminder = async (lastDayReminderData) => {
    const { medicationId, patientId, expiresAt } = lastDayReminderData;

    console.log("\n#UltimoDiaMedicamento# Envio da notificação alertando o último dia da medicação!!\n");

    try {
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

        const notification = new NotificationStructure(
            'Atenção! Medicação Próxima do Fim',
            `Olá ${(patient.name).split(' ')[0]}, sua medicação ${medication.name} está perto de acabar.`,
            {
                notify_type: 'treatment',
                notify_function: 'medication_last_day_alert',
                show_modal: false,
                redirect_params: {
                    screen: ScreenTypes.HEALTH_MEDICATIONS,
                    menu_option: MenuTypes.SAÚDE,
                    page: PageTypes.SAÚDE.MEDICAMENTOS
                },
                icon: MessageTypes.WARNING
            }
        );

        const notificationSended = await notification.sendToPatient(patientId);
        if (!notificationSended) {
            console.log("Notificação de último dia de medicação não enviada.");
        }

    } catch (error) {
        console.error("Erro ao enviar a notificação do último dia da medicação: ", error);
    }
}

module.exports = { 
    createNewMedicationHistory, 
    updateMedicationHistoryToAlert, 
    endMedication,
    sendLastDayMedicationReminder
}