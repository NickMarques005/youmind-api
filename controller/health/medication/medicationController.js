const Medication = require('../../../models/medication');
const { PatientMedicationHistory } = require('../../../models/patient_history');
const { PatientUser } = require('../../../models/users');
const { HandleError, HandleSuccess } = require('../../../utils/response/handleResponse');
const MessageTypes = require('../../../utils/response/typeResponse');
const agenda = require('../../../agenda/agenda_config');
const { scheduleMedicationTask } = require('../../../agenda/defines/medications');
const Treatment = require('../../../models/treatment');

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

            let nextScheduleTime = null;
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            for (const schedule of updatedMedication.schedules) {
                const [hours, minutes] = schedule.split(':').map(Number);
                const scheduleTime = new Date(today);
                scheduleTime.setHours(hours, minutes, 0, 0);

                if (scheduleTime > now) {
                    nextScheduleTime = scheduleTime;
                    break;
                }
            }

            if (!nextScheduleTime) {
                nextScheduleTime = new Date(updatedMedication.start);
                while (nextScheduleTime <= now) {
                    nextScheduleTime.setDate(nextScheduleTime.getDate() + updatedMedication.frequency);
                }

                const firstSchedule = updatedMedication.schedules[0];
                const [hours, minutes] = firstSchedule.split(':').map(Number);
                nextScheduleTime.setHours(hours, minutes, 0, 0);
            }

            await scheduleMedicationTask(updatedMedication, nextScheduleTime, agenda);
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

        await PatientMedicationHistory.findOneAndDelete({ medicationId: id, pending: true });


        //Logica de agenda
        const canceledAlerts = await agenda.cancel({ name: 'send medication alert', 'data.medicationId': medication._id });
        const canceledNotTaken = await agenda.cancel({ name: 'medication not taken', 'data.medicationId': medication._id });
        console.log("Agendamentos cancelados!");

        if (canceledAlerts > 0) {
            console.log("Agendamentos alerta cancelados!");
        } else {
            console.warn("Nenhum agendamento alerta foi cancelado.");
        }
        if(canceledNotTaken > 0) {
            console.log("Agendamentos not taken cancelados!");
        }
        else{
            console.log("Nenhum agendamento not taken foi cancelado.");
        }
        //

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

        if(canceledNotTaken > 0) {
            console.log("Agendamentos not taken cancelados!");
        }
        else{
            console.log("Nenhum agendamento not taken foi cancelado.");
        }

        return HandleSuccess(res, 200, "Parabéns! Você confirmou seu alarme e tomou o medicamento no horário certo. Continue cuidando de si mesmo, você está no caminho certo!", MessageTypes.SUCCESS);
    } catch (err) {
        console.error(`Erro ao confirmar alerta: ${err.message}`);
        return HandleError(res, 500, `Erro ao confirmar alerta: ${err.message}`);
    }
}

exports.getMedicationsTakenOnDate = async (req, res) => {
    try {
        const { uid } = req.user;
        const { selectedDate } = req.query;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!selectedDate) return HandleError(res, 400, "Data não fornecida");

        const patient = await PatientUser.findOne({uid: uid});
        if(!patient) return HandleError("Você não é um paciente");

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const medicationsTaken = await PatientMedicationHistory.find({
            patientId: uid,
            'medication.taken': true,
            $or: [
                { 'medication.consumeDate': { $gte: startOfDay, $lte: endOfDay } },
                { 'medication.updatedAt': { $gte: startOfDay, $lte: endOfDay } }
            ]
        });

        if (!medicationsTaken || medicationsTaken.length === 0) {
            return HandleSuccess(res, 200, "Nenhum medicamento tomado encontrado para a data selecionada");
        }

        const takenMedications = medicationsTaken.map(medication => ({
            currentSchedule: medication.medication.currentSchedule,
            medicationId: medication.medication.medicationId
        }));

        return HandleSuccess(res, 200, "Medicamentos tomados encontrados", takenMedications);
    } catch (err) {
        console.error(`Erro ao buscar medicamentos tomados: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao buscar medicamentos tomados");
    }
};