const Medication = require('../../../models/medication');
const { PatientMedicationHistory } = require('../../../models/patient_history');
const { PatientUser } = require('../../../models/users');
const { HandleError, HandleSuccess } = require('../../../utils/response/handleResponse');
const MessageTypes = require('../../../utils/response/typeResponse');
const { getAgenda } = require('../../../agenda/agenda_manager');
const { scheduleMedicationTask } = require('../../../agenda/defines/medications');
const Treatment = require('../../../models/treatment');
const { getNextScheduleTime, getStartOfTheDay, getEndOfTheDay, convertDateToBrazilDate, setDateToSpecificTime } = require('../../../utils/date/timeZones');

exports.getMedications = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Não autorizado");

        const medications = await Medication.find({ patientId: uid });
        if (!medications || medications.length === 0) return HandleSuccess(res, 200, "Nenhum medicamento encontrado");

        return HandleSuccess(res, 200, "Medicamentos encontrados", medications);
    } catch (err) {
        console.error(`Erro ao buscar medicamentos: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao buscar medicamentos");
    }
};

exports.createMedication = async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, dosage, type, expiresAt, frequency, schedules, start, alarmDuration, reminderTimes } = req.body;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!name || !dosage || !type || !expiresAt || !frequency || !schedules || !start || !alarmDuration || !reminderTimes) {
            return HandleError(res, 400, "Dados incompletos para criar o medicamento");
        }

        if (new Date(expiresAt) <= Date.now()) {
            return HandleError(res, 400, "Data de término deve ser posterior à data atual");
        }

        const zeroFields = [];
        if (parseInt(frequency) === 0) {
            zeroFields.push('Frequência');
        }
        if (parseInt(dosage) === 0) {
            zeroFields.push('Dosagem');
        }

        const emptyFields = [];
        if (schedules.length === 0) {
            emptyFields.push('Horários');
        }

        if (zeroFields.length > 0 || emptyFields.length > 0) {
            let errorMessage = "";
            if (zeroFields.length > 0) {
                errorMessage += `Os seguintes campos têm valores zero: ${zeroFields.join(', ')}. `;
            }
            if (emptyFields.length > 0) {
                errorMessage += `Os seguintes campos estão vazios: ${emptyFields.join(', ')}.`;
            }
            return HandleError(res, 400, errorMessage);
        }

        const newMedication = new Medication({
            name,
            dosage,
            type,
            expiresAt,
            frequency,
            schedules,
            start,
            alarmDuration,
            reminderTimes,
            patientId: uid
        });
        await newMedication.save();

        return HandleSuccess(res, 201, "Medicamento criado com sucesso", newMedication, MessageTypes.MEDICATION);
    } catch (err) {
        console.error(`Erro ao criar medicamento: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao criar medicamento");
    }
};

exports.updateMedication = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id, name, dosage, type, expiresAt, frequency, schedules, start, alarmDuration, reminderTimes } = req.body;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!id) return HandleError(res, 400, "Medicamento não especificado");

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (dosage !== undefined) updateFields.dosage = dosage;
        if (type !== undefined) updateFields.type = type;
        if (expiresAt !== undefined) {
            if (new Date(expiresAt) <= Date.now()) {
                return HandleError(res, 400, "A nova data de término deve ser posterior à data atual");
            }
            updateFields.expiresAt = expiresAt;
        }
        if (frequency !== undefined) updateFields.frequency = frequency;
        if (schedules !== undefined) updateFields.schedules = schedules;
        if (start !== undefined) updateFields.start = start;
        if (alarmDuration !== undefined) updateFields.alarmDuration = alarmDuration;
        if (reminderTimes !== undefined) updateFields.reminderTimes = reminderTimes;

        const updatedMedication = await Medication.findOneAndUpdate(
            { _id: id, patientId: uid },
            updateFields,
            { new: true }
        );

        if (!updatedMedication) return HandleError(res, 404, "Medicamento não encontrado");

        const result = await PatientMedicationHistory.deleteMany({
            'medication.medicationId': updatedMedication._id,
            'medication.pending': true
        });

        console.log(`Total de ${result.deletedCount} patient medication history deletados`);

        const patient = await PatientUser.findOne({ uid });
        const treatment = await Treatment.findOne({ patientId: uid, status: 'active' });
        if (patient && treatment) {
            const agenda = getAgenda();
            if (agenda) {
                console.log("Logica de Reagendamento!!");
                const canceledAlerts = await agenda.cancel({ name: 'send medication alert', 'data.medicationId': updatedMedication._id });
                const canceledNotTaken = await agenda.cancel({ name: 'medication not taken', 'data.medicationId': updatedMedication._id });
                console.log("Agendamentos cancelados!");

                if (canceledAlerts > 0) {
                    console.log("Agendamentos alerta cancelados!");
                } else {
                    console.warn("Nenhum agendamento alerta foi cancelado.");
                }
                if (canceledNotTaken > 0) {
                    console.log("Agendamentos not taken cancelados!");
                } else {
                    console.log("Nenhum agendamento not taken foi cancelado.");
                }

                const nextScheduleTime = getNextScheduleTime(updatedMedication.schedules, updatedMedication.start, updatedMedication.frequency);
                await scheduleMedicationTask(updatedMedication, nextScheduleTime, agenda);
            }
            else {
                console.warn("Agenda não inicializada, não foi possível reagendar a tarefa.");
            }
        }

        return HandleSuccess(res, 200, "Medicamento atualizado com sucesso", updatedMedication, MessageTypes.MEDICATION);
    } catch (err) {
        console.error(`Erro ao atualizar medicamento: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao atualizar medicamento");
    }
};

exports.deleteMedication = async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.body;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!id) return HandleError(res, 400, "Id do medicamento não especificado");

        const medication = await Medication.findOneAndDelete({ _id: id, patientId: uid });

        if (!medication) return HandleError(res, 404, "Medicamento não encontrado");

        await PatientMedicationHistory.deleteMany({ 'medication.medicationId': id, 'medication.pending': true });

        const agenda = getAgenda();
        if (agenda) {
            //Logica de cancelamento de agendamento
            const canceledAlerts = await agenda.cancel({ name: 'send medication alert', 'data.medicationId': medication._id });
            const canceledNotTaken = await agenda.cancel({ name: 'medication not taken', 'data.medicationId': medication._id });
            console.log("Agendamentos cancelados!");

            if (canceledAlerts > 0) {
                console.log("Agendamentos alerta cancelados!");
            } else {
                console.warn("Nenhum agendamento alerta foi cancelado.");
            }
            if (canceledNotTaken > 0) {
                console.log("Agendamentos not taken cancelados!");
            }
            else {
                console.log("Nenhum agendamento not taken foi cancelado.");
            }
        }
        else {
            console.warn("Agenda não inicializada, não foi possível reagendar a tarefa.");
        }

        return HandleSuccess(res, 200, "Medicamento deletado com sucesso", { id: medication.id }, MessageTypes.SUCCESS);
    } catch (err) {
        console.error(`Erro ao deletar medicamento: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao deletar medicamento");
    }
};

exports.deleteManyMedications = async (req, res) => {
    try {
        const { uid } = req.user;
        const { ids } = req.body;


    } catch (err) {
        console.error(`Erro ao deletar medicamento: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao deletar medicamentos");
    }
}

exports.getMedicationPending = async (req, res) => {
    try {
        const { uid } = req.user;
        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        const medicationHistory = await PatientMedicationHistory.findOne({
            patientId: patient.uid,
            'medication.alert': true
        });

        if (!medicationHistory) return HandleSuccess(res, 200, "Nenhum alerta encontrado");
        const medicationId = medicationHistory.medication.medicationId;

        const medication = await Medication.findById(medicationId);
        if (!medication) {
            return HandleError(res, 404, "Medicamento não encontrado");
        }
        const currentSchedule = medicationHistory.medication.currentSchedule;

        const medicationPending = {
            medicationHistoryId: medicationHistory._id,
            medication: medication,
            currentSchedule: currentSchedule
        };

        return HandleSuccess(res, 201, "Alerta de medicamento!", medicationPending);
    } catch (err) {
        console.error(`Erro ao buscar medication pending: ${err.message}`);
        return HandleError(res, 500, `Erro ao buscar alerta de medicação: ${err.message}`);
    }
}

exports.confirmMedicationAlert = async (req, res) => {
    try {
        const { uid } = req.user;
        const { medicationHistoryId } = req.body;
        const agenda = getAgenda();

        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        console.log("Medication History Id: ", medicationHistoryId);

        const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId)

        if (!medicationHistory) return HandleError(res, 404, "Histórico de medicação não encontrado ou alerta não está ativo");

        medicationHistory.medication.taken = true;
        medicationHistory.medication.pending = false;
        medicationHistory.medication.alert = false;

        console.log("MedicationHistory atualizado: ", medicationHistory);

        await medicationHistory.save();

        const canceledNotTaken = await agenda.cancel({ name: 'medication not taken', 'data.medicationHistoryId': medicationHistory._id });

        if (canceledNotTaken > 0) {
            console.log("Agendamentos not taken cancelados!");
        }
        else {
            console.log("Nenhum agendamento not taken foi cancelado.");
        }

        return HandleSuccess(res, 200, "Parabéns! Você confirmou seu alarme e tomou o medicamento no horário certo. Continue cuidando de si mesmo, você está no caminho certo!", MessageTypes.SUCCESS);
    } catch (err) {
        console.error(`Erro ao confirmar alerta: ${err.message}`);
        return HandleError(res, 500, `Erro ao confirmar alerta: ${err.message}`);
    }
}

exports.getMedicationsToConsumeOnDate = async (req, res) => {
    try {
        const { uid } = req.user;
        const { selectedDate } = req.query;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!selectedDate) return HandleError(res, 400, "Data não fornecida");

        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError("Você não é um paciente");

        const treatment = await Treatment.findOne({
            patientId: patient.uid
        });
        if (!treatment) return HandleError("Você não está em tratamento no momento");

        const convertedTime = new Date(selectedDate);

        console.log("Data escolhida: ", convertedTime);

        const startOfDay = getStartOfTheDay(convertedTime);
        const endOfDay = getEndOfTheDay(convertedTime);

        console.log('Data inicial do dia:', startOfDay);
        console.log('Data final do dia:', endOfDay);

        const today = getStartOfTheDay(convertDateToBrazilDate(new Date()));
        const isPastDate = convertedTime < today;

        console.log("HOJE: ", today);

        const medications = await Medication.find({
            patientId: uid
        });

        const historyRecords = await PatientMedicationHistory.find({
            patientId: uid,
            'medication.consumeDate': { $gte: startOfDay, $lte: endOfDay }
        });

        let medicationHistories = [];

        if (isPastDate) {
            console.log("Data menor que hoje");

            medicationHistories.push(...historyRecords);
        }
        else {
            console.log("Data igual a hoje ou posterior");
            for (let medication of medications) {
                console.log("Medicamento: ", medication.name);
                const startDate = convertDateToBrazilDate(medication.start);
                const expiresAt = convertDateToBrazilDate(medication.expiresAt);
                const frequency = medication.frequency;

                if (convertedTime >= startDate && convertedTime <= expiresAt) {
                    const differenceInMilliseconds = convertedTime.getTime() - startDate.getTime();
                    const differenceInDays = Math.floor(differenceInMilliseconds / (1000 * 3600 * 24));

                    // Verifica se a data selecionada coincide com a frequência do medicamento
                    if (differenceInDays % frequency === 0) {
                        const schedules = medication.schedules;

                        for (let schedule of schedules) {
                            let history = await PatientMedicationHistory.findOne({
                                patientId: uid,
                                'medication.medicationId': medication._id,
                                'medication.currentSchedule': schedule,
                                'medication.consumeDate': { $gte: startOfDay, $lte: endOfDay }
                            });

                            if (!history) {
                                history = {
                                    patientId: uid,
                                    medication: {
                                        medicationId: medication._id,
                                        name: medication.name,
                                        dosage: medication.dosage,
                                        type: medication.type,
                                        frequency: medication.frequency,
                                        start: medication.start,
                                        expiresAt: medication.expiresAt,
                                        schedules: medication.schedules,
                                        alarmDuration: medication.alarmDuration,
                                        reminderTimes: medication.reminderTimes,
                                        taken: undefined,
                                        pending: false,
                                        currentSchedule: schedule,
                                        consumeDate: setDateToSpecificTime(convertedTime, schedule)
                                    },
                                    treatmentId: treatment._id.toString()
                                };
                            }

                            medicationHistories.push(history);
                        }

                        const pastSchedules = historyRecords.filter(record => {
                                return !medication.schedules.includes(record.medication.currentSchedule);
                        });
                        
                        medicationHistories.push(...pastSchedules);
                    }
                }
            }
        }

        // Ordena o histórico de medicamentos por consumeDate
        medicationHistories.sort((a, b) => {
            const dateA = new Date(a.medication.consumeDate);
            const dateB = new Date(b.medication.consumeDate);
            return dateA - dateB;  // Ordena em ordem crescente
        });

        medicationHistories.forEach(history => {
            console.log('consumeDate:', history.medication.consumeDate, 'parsedDate:', new Date(history.medication.consumeDate));
        });

        const formattedMedicationHistories = await Promise.all(medicationHistories.map(async (history) => {
            const medication = history.medication;
            const currentMedication = {
                _id: medication.medicationId,
                name: medication.name,
                dosage: medication.dosage,
                type: medication.type,
                expiresAt: medication.expiresAt,
                frequency: medication.frequency,
                schedules: medication.schedules,
                start: medication.start,
                alarmDuration: medication.alarmDuration,
                reminderTimes: medication.reminderTimes,
                patientId: history.patientId,
                createdAt: medication.createdAt,
                updatedAt: medication.updatedAt,
            };

            return {
                _id: history._id,
                patientId: history.patientId,
                currentMedication: currentMedication,
                currentSchedule: history.medication.currentSchedule,
                pending: history.medication.pending,
                alert: history.medication.alert,
                taken: history.medication.taken,
                consumeDate: history.medication.consumeDate,
                updatedAt: history.medication.updatedAt
            };
        }));

        return HandleSuccess(res, 200, "Histórico de medicamentos encontrado", formattedMedicationHistories);
    } catch (err) {
        console.error(`Erro ao buscar medicamentos tomados: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao buscar medicamentos tomados");
    }
};