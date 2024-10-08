const { PatientUser } = require('../../../../../models/users');
const { PatientMedicationHistory } = require('../../../../../models/patient_history');
const Treatment = require('../../../../../models/treatment');
const Medication = require('../../../../../models/medication');
const { scheduleMedicationNotTakenTask } = require('../../../../../services/medications/medicationScheduler');
const { getAgenda } = require('../../../../../agenda/agenda_manager');
const { ScreenTypes, MenuTypes, PageTypes } = require('../../../../../utils/app/screenMenuTypes');
const { MessageTypes } = require('../../../../../utils/response/typeResponse');
const { getNextScheduleTime } = require('../../../../../utils/date/timeZones');
const { endMedication } = require('../../../../../services/medications/medicationService');
const { formatLatestMedication } = require('../../../../../utils/history/formatHistory');
const NotificationStructure = require('../../../../../services/notifications/notificationStructure');
const { emitUpdateHistory, emitHistoryMedicationUpdate, emitHistoryMedicationDelete } = require('../../../../../socket/events/historyPatientEvents');

const handleUpdateHistoryMedication = async (change, io) => {
    const agenda = getAgenda();

    const updatedFields = change.updateDescription.updatedFields;
    console.log("Update History Medication: ", updatedFields);
    if (updatedFields) {
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

        const treatment = await Treatment.findOne({ patientId: patientId });
        if (!treatment) {
            console.log("Tratamento não encontrado");
            return;
        }

        const doctorId = treatment.doctorId;

        if (updatedFields['medication.alert'] === true || updatedFields['alert'] === true) {
            console.log("ALERTA DE MEDICAMENTO!!");

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
                /*
                ### Envio dos dados por Socket
                */
                console.log(`Paciente ${patientId} está online. Emitindo alerta.`);
                io.to(patientId).emit('medicationPending', medicationPending);
                console.log(`Alerta emitido para a sala ${patientId}`);
            }
            else {
                /*
                ### Envio da notificação:
                */
                const notification = new NotificationStructure(
                    'Hora de tomar seu medicamento',
                    `Olá ${(patient.name).split(' ')[0]}, é hora de tomar seu medicamento: ${medication.name}.`,
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

                if (notificationSended) {
                    console.log(`Notificação de alerta de medicamento enviada para o paciente ${patientId}`);
                }
            }

            if (agenda) {
                console.log("Schedule Not Taken Medication!!");
                await scheduleMedicationNotTakenTask(medicationHistory, medication, agenda);
            }
        }
        else if (updatedFields['medication.taken'] === false) {
            console.log("MEDICATION NOT TAKEN EVENT DETECTED");
            const medication = await Medication.findById(medicationHistory.medication.medicationId);
            if (!medication) {
                console.error("Medicamento de paciente não encontrado");
                return;
            }

            /*
            ### Envio da notificação:
            */

            const notification = new NotificationStructure(
                'Medicação não tomada',
                `Olá ${(patient.name).split(' ')[0]}, você perdeu a dose de ${medication.name}. Por favor, tome suas medicações conforme prescrito.`,
                {
                    notify_type: 'treatment',
                    notify_function: 'medication_not_taken_alert',
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

            if (notificationSended) {
                console.log(`Notificação enviada para o paciente ${patientId}`);
            }

            const latestMedication = await formatLatestMedication(medicationHistory);

            await emitUpdateHistory({io: io, doctorId: doctorId, patientId: patientId});
            await emitHistoryMedicationUpdate({ io: io, doctorId: doctorId, latestMedication: latestMedication });

            /*
            ### Verificação de último agendamento:
            */
            
            const nextScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency);

            if (medication.expiresAt && medication.expiresAt < nextScheduleTime) {
                endMedication(medication);
            }
        }
        else if (updatedFields['medication.taken'] === true) {
            console.log("MEDICATION TAKEN EVENT");
            const medication = await Medication.findById(medicationHistory.medication.medicationId);
            if (!medication) return console.error("Medicamento de paciente não encontrado");

            const latestMedication = await formatLatestMedication(medicationHistory);

            await emitUpdateHistory({ io: io, doctorId: doctorId, patientId: patientId });
            await emitHistoryMedicationUpdate({ io: io, doctorId: doctorId, latestMedication: latestMedication });

            /*
            ### Verificação de último agendamento:
            */

            const nextScheduleTime = getNextScheduleTime(medication.schedules, medication.start, medication.frequency);

            if (medication.expiresAt && medication.expiresAt < nextScheduleTime) {
                endMedication(medication);
            }
        }
        else if (updatedFields['delete'] === true) {
            /*
            ### Excluir históricos dessa medicação
            */
            await PatientMedicationHistory.deleteOne({ _id: medicationHistoryId });

            const latestMedication = await formatLatestMedication(medicationHistory);

            await emitUpdateHistory({ io: io, doctorId: doctorId, patientId: patientId });
            await emitHistoryMedicationDelete({ io: io, doctorId: doctorId, latestMedication: latestMedication });
        }
    }

    return;
}

module.exports = handleUpdateHistoryMedication;