const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { PatientUser, DoctorUser } = require('../../models/users');
const { calculatePerformance, calculateQuestionnairePerformance } = require('../../utils/questionnaires/performance');
const Medication = require('../../models/medication');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const Questionnaire = require('../../models/questionnaire');
const Treatment = require('../../models/treatment');
const { filterTemplateQuestionsByAnswers } = require('../../services/questionnaires/questionnaireService');
const { calculateTreatmentOverallPerformance } = require('../../services/treatment/performance/performanceServices');

exports.getAllHistory = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Usuário doutor não encontrado");

        const treatments = await Treatment.find({ doctorId: uid, status: 'active' });

        const treatmentLookup = {};

        for (const treatment of treatments) {
            treatmentLookup[treatment.patientId] = treatment._id;
        }

        const patientIds = treatments.map(treatment => treatment.patientId);

        const medicationHistory = await PatientMedicationHistory.find({ patientId: { $in: patientIds } });
        const questionnaireHistory = await PatientQuestionnaireHistory.find({ patientId: { $in: patientIds } });

        const aggregatedHistoryPromises = patientIds.map(async (patientId) => {
            const treatmentId = treatmentLookup[patientId] || null;
            const patientMedications = medicationHistory.filter(hist => hist.patientId === patientId);
            const patientQuestionnaires = questionnaireHistory.filter(hist => hist.patientId === patientId);

            const totalMedications = patientMedications.length;
            const takenMedications = patientMedications.filter(med => med.medication.taken).length;
            const medicationPerformance = totalMedications > 0 ? (takenMedications / totalMedications) * 100 : 0;

            const questionnairePerformance = calculateQuestionnairePerformance(patientQuestionnaires);

            const overallPerformance = await calculateTreatmentOverallPerformance(patientId);

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const lastWeekTaken = patientMedications.filter(med => !med.medication.taken && new Date(med.medication.consumeDate) >= oneWeekAgo).length;

            const patient = await PatientUser.findOne({ uid: patientId }).lean();
            console.log(treatmentId);

            return {
                patientId,
                treatmentId,
                patientName: patient?.name || "Usuário",
                patientEmail: patient?.email,
                patientAvatar: patient?.avatar,
                medicationHistory: {
                    total: patientMedications.length,
                    taken: takenMedications,
                    notTaken: patientMedications.filter(med => !med.medication.taken).length,
                },
                questionnaireHistory: {
                    total: patientQuestionnaires.length,
                    answered: patientQuestionnaires.filter(questionnaire => questionnaire.questionnaire.answered).length,
                    notAnswered: patientQuestionnaires.filter(questionnaire => !questionnaire.questionnaire.answered).length,
                },
                overallPerformance: overallPerformance,
                questionnairePerformance: Math.round(questionnairePerformance),
                medicationPerformance: Math.round(medicationPerformance),
                lastWeekTaken: lastWeekTaken
            };
        });

        const aggregatedHistory = await Promise.all(aggregatedHistoryPromises);

        return HandleSuccess(res, 200, "Histórico de todos os pacientes", aggregatedHistory);
    } catch (err) {
        console.error('Erro ao buscar histórico do paciente:', err);
        return HandleError(res, 500, "Erro ao buscar histórico do paciente");
    }
}

exports.getLatestHistory = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Usuário doutor não encontrado");

        const treatments = await Treatment.find({ doctorId: uid });
        const patientIds = treatments.map(treatment => treatment.patientId);

        const latestQuestionnairesHistory = await PatientQuestionnaireHistory.find({
            patientId: { $in: patientIds },
            'questionnaire.pending': false
        })
            .sort({ 'questionnaire.createdAt': -1 })
            .limit(8);

        const latestMedicationsHistory = await PatientMedicationHistory.find({
            patientId: { $in: patientIds },
            'medication.pending': false
        })
            .sort({ 'medication.updatedAt': -1 })
            .limit(8);

        const latestQuestionnaires = await Promise.all(latestQuestionnairesHistory.map(async (history) => {
            const questionnaire = await Questionnaire.findById(history.questionnaire.questionnaireId);
            if (questionnaire) {
                let filteredTemplate;
                if (questionnaire.answers && questionnaire.checked) {
                    const template = await QuestionnaireTemplate.findById(questionnaire.questionnaireTemplateId);
                    filteredTemplate = filterTemplateQuestionsByAnswers(template, questionnaire.answers);
                }
                return {
                    _id: history._id,
                    patientId: history.patientId,
                    currentQuestionnaire: questionnaire,
                    template: filteredTemplate,
                    pending: history.questionnaire.pending,
                    answered: history.questionnaire.answered,
                    updatedAt: history.questionnaire.updatedAt
                };
            }
            return null;
        }));

        const latestMedications = await Promise.all(latestMedicationsHistory.map(async (history) => {
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
            }

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

        /*
        ### Filtragem para poder retirar questionários nulos
        */
        const filteredLatestQuestionnaires = latestQuestionnaires.filter(q => q !== null);

        return HandleSuccess(res, 200, "Últimos históricos dos pacientes", {
            latestQuestionnaires: filteredLatestQuestionnaires || [],
            latestMedications: latestMedications || []
        });
    } catch (err) {
        console.error('Erro ao buscar últimos históricos dos pacientes:', err);
        return HandleError(res, 500, "Erro ao buscar últimos históricos dos pacientes");
    }
}

exports.getQuestionPerformance = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError(res, 404, "Usuário não encontrado");

        const treatment = await Treatment.findOne({ patientId: patient.uid, status: "active" });

        if (!treatment) return HandleSuccess(res, 200, "Nenhum tratamento sendo feito");

        const questionnaireHistories = await PatientQuestionnaireHistory.find({ patientId: uid });

        let totalPerformance = 0;
        let performanceCount = 0;

        questionnaireHistories.forEach(history => {
            if (history.questionnaire.answered === undefined) {
                totalPerformance -= 2;
            } else if (history.questionnaire.answered === true) {
                totalPerformance += 2;
                const performance = calculatePerformance(history.questionnaire.answers || []);
                performanceCount += 1;
                totalPerformance += performance;
            } else {
                totalPerformance -= 2;
            }
        });

        if (performanceCount > 0) {
            totalPerformance = totalPerformance / performanceCount;
        }

        const finalPerformance = Math.min(Math.max(totalPerformance, 0), 100);

        return HandleSuccess(res, 200, "Desempenho dos questionários calculado com sucesso", { performance: finalPerformance });
    } catch (err) {
        console.error('Erro ao buscar desempenho de questionários:', err);
        return HandleError(res, 500, "Erro ao buscar desempenho de questionários");
    }
}

exports.getHistoryQuestionnairesForCurrentPatient = async (req, res) => {
    try {
        const { uid } = req.user;
        const { page = 1, treatment } = req.query;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Doutor não encontrado");

        const currentTreatment = await Treatment.findById(treatment);
        if (!currentTreatment) return HandleError(res, 400, `Tratamento não encontrado`);

        const patient = await PatientUser.findOne({ uid: currentTreatment.patientId });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        const limit = 10;
        const skip = page * limit;

        console.log(skip);

        const questionnaireHistories = await PatientQuestionnaireHistory.find({ patientId: patient.uid })
            .sort({ 'questionnaire.pending': -1, 'questionnaire.updatedAt': -1 })
            .limit(limit)
            .skip(skip);

        const questionnaires = await Promise.all(questionnaireHistories.map(async (history) => {
            const questionnaire = await Questionnaire.findById(history.questionnaire.questionnaireId);
            let filteredTemplate;
            if (questionnaire.answers && questionnaire.checked) {
                const template = await QuestionnaireTemplate.findById(questionnaire.questionnaireTemplateId);
                filteredTemplate = filterTemplateQuestionsByAnswers(template, questionnaire.answers);
            }
            return {
                _id: history._id,
                patientId: history.patientId,
                currentQuestionnaire: questionnaire,
                template: filteredTemplate,
                pending: history.questionnaire.pending,
                answered: history.questionnaire.answered,
                updatedAt: history.questionnaire.updatedAt
            };
        }));

        return HandleSuccess(res, 201, "questionários buscados", { questionnaires: questionnaires || [] });

    } catch (err) {
        console.error('Erro ao buscar histórico de questionários:', err.message);
        return HandleError(res, 500, `Erro ao buscar histórico de questionários: ${err.message}`);
    }
}

exports.getHistoryMedicationsForCurrentPatient = async (req, res) => {

    try {
        const { uid } = req.user;
        const { page = 1, treatment } = req.query;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Doutor não encontrado");

        const currentTreatment = await Treatment.findById(treatment);
        if (!currentTreatment) return HandleError(res, 400, `Tratamento não encontrado`);

        const patient = await PatientUser.findOne({ uid: currentTreatment.patientId });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        const limit = 10;
        const skip = page * limit;

        const medicationHistories = await PatientMedicationHistory.find({ patientId: patient.uid })
            .sort({ 'medication.pending': -1, 'medication.updatedAt': -1 })
            .limit(limit)
            .skip(skip);

        console.log(page);
        console.log(skip);
        console.log(medicationHistories);

        const medications = await Promise.all(medicationHistories.map(async (history) => {
            const hasMedication = await Medication.findById(history.medication.medicationId);
            const inProgress = hasMedication ? true : false;

            const medication = {
                name: history.medication.name,
                dosage: history.medication.dosage,
                schedules: history.medication.schedules,
                type: history.medication.type,
                start: history.medication.start,
                expiresAt: history.medication.expiresAt,
                frequency: history.medication.frequency
            }

            return {
                _id: history._id,
                patientId: history.patientId,
                currentMedication: medication,
                currentSchedule: history.medication.currentSchedule,
                pending: history.medication.pending,
                alert: history.medication.alert,
                taken: history.medication.taken,
                consumeDate: history.medication.consumeDate,
                updatedAt: history.medication.updatedAt,
                inProgress: inProgress
            };
        }));

        return HandleSuccess(res, 201, "Medicamentos buscados", { medications: medications || [] });
    } catch (err) {
        console.error('Erro ao buscar histórico de medicamentos:', err.message);
        return HandleError(res, 500, `Erro ao buscar histórico de medicamentos: ${err.message}`);
    }
}
