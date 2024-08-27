const Medication = require('../../../models/medication');
const { PatientMedicationHistory } = require('../../../models/patient_history');
const { PatientUser } = require('../../../models/users');
const { HandleError, HandleSuccess } = require('../../../utils/response/handleResponse');
const MessageTypes = require('../../../utils/response/typeResponse');
const Treatment = require('../../../models/treatment');
const { getNextScheduleTime, getStartOfTheDay, getEndOfTheDay, convertDateToBrazilDate, setDateToSpecificTime } = require('../../../utils/date/timeZones');
const { scheduleMedicationTask, cancelSpecificMedicationSchedules, cancelSpecificMedicationNotTakenSchedule, initializeMedicationScheduleProcess } = require('../../../services/medications/medicationScheduler');
const { getAgenda } = require('../../../agenda/agenda_manager');

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
        
        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");
        
        /*
        ### Verifica os dados obrigatórios para criar medicamento
        */
        if (!name || !dosage || !type || !alarmDuration || !reminderTimes) {
            return HandleError(res, 400, "Dados incompletos para criar o medicamento");
        }

        // Verificação de Campos com Valor Zero
        const zeroFields = [];

        if (parseInt(dosage) === 0) {
            zeroFields.push('Dosagem');
        }

        let newMedicationData = {
            name,
            dosage,
            type,
            alarmDuration,
            reminderTimes,
            patientId: uid,
        };

        if (patient.is_treatment_running) {
            if (!expiresAt || !frequency || !schedules || !start) {
                return HandleError(res, 400, "Campos necessários para agendamentos não foram fornecidos");
            }

            // Verificação da Data de Término
            if (new Date(expiresAt) <= Date.now()) {
                return HandleError(res, 400, "Data de término deve ser posterior à data atual");
            }

            if (parseInt(frequency) === 0) {
                zeroFields.push('Frequência');
            }

            // Verificação de Campos Vazios
            if (schedules.length === 0) {
                return HandleError(res, 400, "Horários não podem estar vazios");
            }

            newMedicationData = {
                ...newMedicationData,
                expiresAt,
                frequency,
                schedules,
                start,
            };
        }

        // Se algum campo tiver valor zero, retornar erro
        if (zeroFields.length > 0) {
            return HandleError(res, 400, `Os seguintes campos têm valores zero: ${zeroFields.join(', ')}`);
        }

        const newMedication = new Medication(newMedicationData);
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
        if (alarmDuration !== undefined) updateFields.alarmDuration = alarmDuration;
        if (reminderTimes !== undefined) updateFields.reminderTimes = reminderTimes;

        const patient = await PatientUser.findOne({ uid });
        if (patient.is_treatment_running) {
            if (expiresAt !== undefined) {
                if (new Date(expiresAt) <= Date.now()) {
                    return HandleError(res, 400, "A nova data de término deve ser posterior à data atual");
                }
                updateFields.expiresAt = expiresAt;
            }
            if (frequency !== undefined) updateFields.frequency = frequency;
            if (schedules !== undefined) updateFields.schedules = schedules;
            if (start !== undefined) updateFields.start = start;
        }
        const updatedMedication = await Medication.findOneAndUpdate(
            { _id: id, patientId: uid },
            updateFields,
            { new: true }
        );

        if (!updatedMedication) return HandleError(res, 404, "Medicamento não encontrado");

        //Processo de atualização de agendamento

        const treatment = await Treatment.findOne({ patientId: uid, status: 'active' });
        if (patient.is_treatment_running && treatment) {
            const agenda = getAgenda();
            /*
            ### Atualizar históricos da medicação que estiverem pending true para delete true
            */
            const result = await PatientMedicationHistory.updateMany(
                { 'medication.medicationId': updatedMedication._id, 'medication.pending': true },
                { $set: { delete: true } }
            );
            console.log(`Total de ${result.modifiedCount} patient medication history atualizados para delete: true`);
            
            /*
            ### Cancelamento de todos os agendamentos relacionados a esse medicamento sendo excluído
            */
            await cancelSpecificMedicationSchedules(updatedMedication._id, agenda);

            /*
            ### Reagendamento do medicamento atualizado
            */
            await initializeMedicationScheduleProcess(updatedMedication, agenda);
        }

        return HandleSuccess(res, 200, "Medicamento atualizado com sucesso", updatedMedication, MessageTypes.MEDICATION);
    } catch (err) {
        console.error(`Erro ao atualizar medicamento: ${err.message}`);
        return HandleError(res, 500, "Erro interno no servidor ao atualizar medicamento");
    }
};

exports.deleteMedication = async (req, res) => {
    try {
        const agenda = getAgenda();
        const { uid } = req.user;
        const { id } = req.body;

        if (!uid) return HandleError(res, 401, "Não autorizado");
        if (!id) return HandleError(res, 400, "Id do medicamento não especificado");

        const medication = await Medication.findOneAndDelete({ _id: id, patientId: uid });
        if (!medication) return HandleError(res, 404, "Medicamento não encontrado");

        /*
        ### Atualizar históricos da medicação que estiverem pending true para delete true
        */
        const result = await PatientMedicationHistory.updateMany(
            { 'medication.medicationId': medication._id, 'medication.pending': true },
            { $set: { delete: true } }
        );
        console.log(`Total de ${result.modifiedCount} patient medication history atualizados para delete: true`);

        /*
        ### Cancelamento de todos os agendamentos relacionados a esse medicamento
        */
        await cancelSpecificMedicationSchedules(medication._id, agenda);

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

        const medicationHistory = await PatientMedicationHistory.findById(medicationHistoryId)

        if (!medicationHistory) return HandleError(res, 404, "Histórico de medicação não encontrado ou alerta não está ativo");

        medicationHistory.medication.taken = true;
        medicationHistory.medication.pending = false;
        medicationHistory.medication.alert = false;

        await medicationHistory.save();

        await cancelSpecificMedicationNotTakenSchedule(medicationHistory._id, agenda);

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

        const startOfDay = getStartOfTheDay(convertedTime);
        const endOfDay = getEndOfTheDay(convertedTime);

        const today = getStartOfTheDay(convertDateToBrazilDate(new Date()));
        const isPastDate = convertedTime < today;

        const medications = await Medication.find({
            patientId: uid
        });

        const historyRecords = await PatientMedicationHistory.find({
            patientId: uid,
            'medication.consumeDate': { $gte: startOfDay, $lte: endOfDay }
        });

        console.log(historyRecords);

        let medicationHistories = [];

        /*
        ### Se a data é anterior ao dia de hoje, então apenas retorne os históricos
        */
        if (isPastDate) {
            medicationHistories.push(...historyRecords);
        }
        /*
        ### Se não, filtrar os históricos de cada medicamento de acordo com o dia selecionado
        */
        else {
            /*
            ### Filtragem dos históricos que possuem medicamento registrado
            */
            for (let medication of medications) {
                const startDate = convertDateToBrazilDate(medication.start);
                const expiresAt = convertDateToBrazilDate(medication.expiresAt);
                const frequency = medication.frequency;

                if (convertedTime >= startDate && convertedTime <= expiresAt) {
                    const differenceInMilliseconds = convertedTime.getTime() - startDate.getTime();
                    const differenceInDays = Math.floor(differenceInMilliseconds / (1000 * 3600 * 24));

                    // Verifica se a data selecionada coincide com a frequência do medicamento
                    if (differenceInDays % frequency === 0) {
                        console.log(`#getMedicationOnConsumeDate# Tem medicação ${medication.name} hoje!`);
                        const schedules = medication.schedules;

                        for (let schedule of schedules) {
                            // Busca o histórico para esse horário
                            let history = await PatientMedicationHistory.findOne({
                                patientId: uid,
                                'medication.medicationId': medication._id,
                                'medication.currentSchedule': schedule,
                                'medication.consumeDate': { $gte: startOfDay, $lte: endOfDay }
                            });

                            //Caso não ache, significa que ele não foi adicionado ainda, portanto é necessário criar um histórico temporário para visualização do usuário
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

                            // Verificação dos históricos que podem já estar dentro da lista dos históricos que serão retornados ao usuário (Evita duplicatas)
                            const alreadyExists = medicationHistories.some(existingHistory => 
                                existingHistory.medication.medicationId.toString() === history.medication.medicationId.toString() &&
                                existingHistory.medication.currentSchedule === history.medication.currentSchedule &&
                                existingHistory.medication.consumeDate.getTime() === history.medication.consumeDate.getTime()
                            );
                            
                            if (!alreadyExists) {
                                medicationHistories.push(history);
                            }
                        }

                        // Busca históricos passados que não estão registrados mais nos horários do medicamento
                        const pastSchedules = historyRecords.filter(record => {
                            return !medication.schedules.includes(record.medication.currentSchedule);
                        });

                        // Garantia paraque não haja históricos de medicamento duplicados
                        const uniquePastSchedules = pastSchedules.filter(pastSchedule => 
                            !medicationHistories.some(existingHistory =>
                                existingHistory.medication.medicationId.toString() === pastSchedule.medication.medicationId.toString() &&
                                existingHistory.medication.currentSchedule === pastSchedule.medication.currentSchedule &&
                                existingHistory.medication.consumeDate.getTime() === pastSchedule.medication.consumeDate.getTime()
                            )
                        );
                        
                        medicationHistories.push(...uniquePastSchedules);
                    }
                }
            }

            /*
            ### Filtragem dos históricos que não possuem mais medicamento registrado
            */
            const unlinkedHistories = historyRecords.filter(record => 
                !medicationHistories.some(existingHistory => 
                    existingHistory.medication.medicationId.toString() === record.medication.medicationId.toString() &&
                    existingHistory.medication.currentSchedule === record.medication.currentSchedule &&
                    existingHistory.medication.consumeDate.getTime() === record.medication.consumeDate.getTime()
                )
            );

            medicationHistories.push(...unlinkedHistories);
        }

        // Ordena o histórico de medicamentos por consumeDate
        medicationHistories.sort((a, b) => {
            const dateA = new Date(a.medication.consumeDate);
            const dateB = new Date(b.medication.consumeDate);
            return dateA - dateB;  // Ordena em ordem crescente
        });

        medicationHistories.forEach((history, index) => {
            console.log(`#getMedicationOnConsumeDate# Histórico ${index + 1}: `, history.medication.currentSchedule);
        })

        /*
        ### Formatação dos históricos do medicamento para serem recebidos e tratados corretamente
        */
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