const { PatientUser } = require('../../../../../models/users');
const { PatientMedicationHistory } = require('../../../../../models/patient_history');
const Treatment = require('../../../../../models/treatment');
const Medication = require('../../../../../models/medication');
const { scheduleMedicationNotTakenTask } = require('../../../../../services/medications/medicationScheduler');
const { getAgenda } = require('../../../../../agenda/agenda_manager');
const notificationService = require('../../../../../services/notifications/notificationService');
const { ScreenTypes, MenuTypes, PageTypes } = require('../../../../../utils/app/screenMenuTypes');
const MessageTypes = require('../../../../../utils/response/typeResponse');
const { emitUpdateHistory, emitHistoryMedicationUpdate } = require('../../../../../services/history/historyService');
const { getNextScheduleTime } = require('../../../../../utils/date/timeZones');
const { endMedication } = require('../../../../../services/medications/medicationService');
const { formatLatestMedication } = require('../../../../../utils/history/formatHistory');

const handleUpdateHistoryMedication = async (change, io) => {
    const agenda = getAgenda();

    const updatedFields = change.updateDescription.updatedFields;
    console.log("Update History Medication: ", updatedFields);

    if (updatedFields['medication.alert'] === true || updatedFields['alert'] === true) {
        console.log("ALERTA DE MEDICAMENTO!!");

        const medicationHistoryId = change.documentKey._id;
        const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);
        if (!medicationHistory) {
            console.error(`Medicação não foi encontrada no histórico: ${medicationHistoryId}`);
            return;
        }

        const patientId = medicationHistory.patientId;
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.error(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const medication = await Medication.findById(medicationHistory.medication.medicationId);

        if (!medication) return console.error("Medicamento de paciente não encontrado");

        const currentSchedule = medicationHistory.medication.currentSchedule;

        const medicationPending = {
            medication: medication,
            currentSchedule: currentSchedule,
            medicationHistoryId: medicationHistory._id
        };

        const sockets = io.of("/").adapter.rooms.get(patientId);
        if (sockets && sockets.size > 0) {
            console.log(`Paciente ${patientId} está online. Emitindo alerta.`);
            io.to(patientId).emit('medicationPending', medicationPending);
            console.log(`Alerta emitido para a sala ${patientId}`);
        }
        else {
            const notificationData = {
                title: 'Hora de tomar seu medicamento',
                body: `Olá ${(patient.name).split(' ')[0]}, é hora de tomar seu medicamento: ${medication.name}.`,
                data: {
                    notify_type: 'treatment',
                    notify_function: 'medication_alert',
                    show_modal: false,
                    redirect_params: {
                        screen: ScreenTypes.HEALTH_MEDICATIONS,
                        menu_option: MenuTypes.SAÚDE,
                        page: PageTypes.SAÚDE.MEDICAMENTOS
                    },
                    icon: MessageTypes.INFO
                },
            };

            const notificationSended = await notificationService.sendNotificationToAllDevices(patientId, notificationData);

            if (notificationSended) {
                console.log(`Notificação de alerta de medicamento enviada para o paciente ${patientId}`);
            }
        }

        if (agenda) {
            console.log("Schedule Not Taken Medication!!");
            await scheduleMedicationNotTakenTask(medicationHistory, medication, agenda);
        }

        const nextScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency, 'America/Sao_Paulo');

        if (medication.expiresAt && new Date(medication.expiresAt) < nextScheduleTime) {
            endMedication(medication);
            
        }
    }
    else if (updatedFields['medication.taken'] === false) {
        console.log("MEDICATION NOT TAKEN EVENT DETECTED");

        const medicationHistoryId = change.documentKey._id;
        const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);
        if (!medicationHistory) {
            console.error(`Histórico de medicação não encontrado: ${medicationHistoryId}`);
            return;
        }

        const patientId = medicationHistory.patientId;
        const patient = await PatientUser.findOne({ uid: patientId });
        if (!patient) {
            console.error(`Paciente não encontrado: ${patientId}`);
            return;
        }

        const medication = await Medication.findById(medicationHistory.medication.medicationId);
        if (!medication) {
            console.error("Medicamento de paciente não encontrado");
            return;
        }

        const notificationData = {
            title: 'Medicação não tomada',
            body: `Olá ${(patient.name).split(' ')[0]}, você perdeu a dose de ${medication.name}. Por favor, tome suas medicações conforme prescrito.`,
            data: {
                notify_type: 'treatment',
                notify_function: 'medication_not_taken_alert',
                show_modal: false,
                redirect_params: {
                    screen: ScreenTypes.HEALTH_MEDICATIONS,
                    menu_option: MenuTypes.SAÚDE,
                    page: PageTypes.SAÚDE.MEDICAMENTOS
                },
                icon: MessageTypes.WARNING
            },
        };

        const notificationSended = await notificationService.sendNotificationToAllDevices(patientId, notificationData);

        if (notificationSended) {
            console.log(`Notificação enviada para o paciente ${patientId}`);
        }

        const treatment = await Treatment.findOne({ patientId: patientId });
        if (!treatment) {
            console.log("Tratamento não encontrado");
            return;
        }

        const doctorId = treatment.doctorId;

        const latestMedication = await formatLatestMedication(medicationHistory);

        await emitUpdateHistory(io, doctorId, patientId);
        await emitHistoryMedicationUpdate(io, doctorId, { latestMedication }, "updateLatestMedication");
    }
    else if (updatedFields['medication.taken'] === true) {
        console.log("MEDICATION TAKEN EVENT");
        const medicationHistoryId = change.documentKey._id;
        const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId);
        if (!medicationHistory) {
            console.error(`Histórico de medicação não encontrado: ${medicationHistoryId}`);
            return;
        }

        const patientId = medicationHistory.patientId;
        const treatment = await Treatment.findOne({ patientId: patientId });
        if (!treatment) {
            console.log("Tratamento não encontrado");
            return;
        }

        const doctorId = treatment.doctorId;

        const latestMedication = await formatLatestMedication(medicationHistory);

        await emitUpdateHistory(io, doctorId, patientId);
        await emitHistoryMedicationUpdate(io, doctorId, latestMedication, "updateLatestMedication");
    }
    return;
}

module.exports = handleUpdateHistoryMedication;