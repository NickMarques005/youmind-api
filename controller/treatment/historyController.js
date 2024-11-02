const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { PatientUser, DoctorUser } = require('../../models/users');
const { calculateQuestionnairePerformance } = require('../../utils/questionnaires/performance');
const Medication = require('../../models/medication');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const Questionnaire = require('../../models/questionnaire');
const Treatment = require('../../models/treatment');
const { filterTemplateQuestionsByAnswers } = require('../../services/questionnaires/questionnaireService');
const { calculateTreatmentOverallPerformance } = require('../../services/treatment/performance/performanceServices');

// Função para obter o histórico completo de todos os pacientes associados a um doutor
exports.getAllHistory = async (req, res) => {
    try {
        // Obtenção do UID do usuário a partir do token de autenticação
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        // Verificação do doutor
        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Usuário doutor não encontrado");

        // Busca por tratamentos ativos do doutor
        const treatments = await Treatment.find({ doctorId: uid, status: 'active' });

        // Mapeamento dos tratamentos para obter IDs de pacientes e tratamentos
        const treatmentLookup = {};
        for (const treatment of treatments) {
            treatmentLookup[treatment.patientId] = treatment._id;
        }
        const patientIds = treatments.map(treatment => treatment.patientId);

        // Busca por históricos de medicação e questionários dos pacientes
        const medicationHistory = await PatientMedicationHistory.find({ patientId: { $in: patientIds } });
        const questionnaireHistory = await PatientQuestionnaireHistory.find({ patientId: { $in: patientIds } });

         // Processamento do histórico agregado para cada paciente
        const aggregatedHistoryPromises = patientIds.map(async (patientId) => {
            const treatmentId = treatmentLookup[patientId] || null;
            const patientMedications = medicationHistory.filter(hist => hist.patientId === patientId);
            const patientQuestionnaires = questionnaireHistory.filter(hist => hist.patientId === patientId);

            // Cálculo do desempenho de medicações e questionários
            const totalMedications = patientMedications.length;
            const takenMedications = patientMedications.filter(med => med.medication.taken).length;
            const medicationPerformance = totalMedications > 0 ? (takenMedications / totalMedications) * 100 : 0;
            const questionnairePerformance = calculateQuestionnairePerformance(patientQuestionnaires);
            const overallPerformance = await calculateTreatmentOverallPerformance(patientId);

            // Cálculo de medicações não tomadas na última semana
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const lastWeekTaken = patientMedications.filter(med => !med.medication.taken && new Date(med.medication.consumeDate) >= oneWeekAgo).length;

            // Busca das informações do paciente
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

        // Resolução das promessas para todos os pacientes
        const aggregatedHistory = await Promise.all(aggregatedHistoryPromises);

        return HandleSuccess(res, 200, "Histórico de todos os pacientes", aggregatedHistory);
    } catch (err) {
        console.error('Erro ao buscar histórico do paciente:', err);
        return HandleError(res, 500, "Erro ao buscar histórico do paciente");
    }
}

// Função para obter o histórico mais recente de questionários e medicações
exports.getLatestHistory = async (req, res) => {
    try {
        // Validação do usuário e obtenção de tratamentos
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Usuário doutor não encontrado");

        const treatments = await Treatment.find({ doctorId: uid });
        const patientIds = treatments.map(treatment => treatment.patientId);

        // Busca dos históricos mais recentes de questionários e medicações
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

        // Processamento dos questionários recentes
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

        // Processamento das medicações recentes
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

// Função para obter o desempenho dos questionários de um paciente específico
exports.getQuestionPerformance = async (req, res) => {
    try {
        // Obtém o ID do usuário da requisição
        const { uid } = req.user;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        // Procura o paciente com o ID do usuário
        const patient = await PatientUser.findOne({ uid: uid });
        if (!patient) return HandleError(res, 404, "Usuário não encontrado");

        // Verifica se o paciente possui um tratamento ativo
        const treatment = await Treatment.findOne({ patientId: patient.uid, status: "active" });
        if (!treatment) return HandleSuccess(res, 200, "Nenhum tratamento sendo feito");

        // Busca o histórico de questionários do paciente
        const questionnaireHistories = await PatientQuestionnaireHistory.find({ patientId: uid });
         // Calcula o desempenho dos questionários
        const finalPerformance = calculateQuestionnairePerformance(questionnaireHistories);

        // Retorna o desempenho calculado com sucesso
        return HandleSuccess(res, 200, "Desempenho dos questionários calculado com sucesso", { performance: finalPerformance });
    } catch (err) {
        // Tratamento de erros
        console.error('Erro ao buscar desempenho de questionários:', err);
        return HandleError(res, 500, "Erro ao buscar desempenho de questionários");
    }
}

// Função para obter o histórico de questionários de um paciente específico
exports.getHistoryQuestionnairesForCurrentPatient = async (req, res) => {
    try {
        const { uid } = req.user;
        const { page = 1, treatment } = req.query;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        // Verifica se o usuário é um doutor
        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Doutor não encontrado");

        // Busca o tratamento atual pelo ID fornecido
        const currentTreatment = await Treatment.findById(treatment);
        if (!currentTreatment) return HandleError(res, 400, `Tratamento não encontrado`);

        // Busca o paciente relacionado ao tratamento
        const patient = await PatientUser.findOne({ uid: currentTreatment.patientId });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

        // Define a paginação para os registros de questionários
        const limit = 10;
        const skip = page * limit;

        console.log(skip);

        // Busca os históricos de questionários do paciente, ordenando por pendentes e data de atualização
        const questionnaireHistories = await PatientQuestionnaireHistory.find({ patientId: patient.uid })
            .sort({ 'questionnaire.pending': -1, 'questionnaire.updatedAt': -1 })
            .limit(limit)
            .skip(skip);

        console.log("Histórico de questionários achados: ", questionnaireHistories);

        // Busca os detalhes do questionário e filtra as perguntas baseadas nas respostas
        const questionnaires = await Promise.all(questionnaireHistories.map(async (history) => {
            const currentQuestionnaire = await Questionnaire.findById(history.questionnaire.questionnaireId);
            console.log("Questionário atual sendo verificado: ", currentQuestionnaire);
            let filteredTemplate;
            if (currentQuestionnaire && currentQuestionnaire.answers && currentQuestionnaire.checked) {
                console.log("Questionário checado e com respostas!");
                const template = await QuestionnaireTemplate.findById(currentQuestionnaire.questionnaireTemplateId);
                if(template)
                {
                    filteredTemplate = filterTemplateQuestionsByAnswers(template, currentQuestionnaire.answers);
                }
            }
            return {
                _id: history._id,
                patientId: history.patientId,
                currentQuestionnaire: currentQuestionnaire,
                template: filteredTemplate,
                pending: history.questionnaire.pending,
                answered: history.questionnaire.answered,
                updatedAt: history.questionnaire.updatedAt
            };
        }));

        // Retorna os questionários encontrados com sucesso
        return HandleSuccess(res, 201, "Questionários buscados", { questionnaires: questionnaires || [] });

    } catch (err) {
        console.error('Erro ao buscar histórico de questionários:', err.message);
        return HandleError(res, 500, `Erro ao buscar histórico de questionários`);
    }
}

// Função para obter o histórico de medicamentos de um paciente específico
exports.getHistoryMedicationsForCurrentPatient = async (req, res) => {

    try {
        const { uid } = req.user;
        const { page = 1, treatment } = req.query;
        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        // Verifica se o usuário é um doutor
        const doctor = await DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Doutor não encontrado");

         // Busca o tratamento atual pelo ID fornecido
        const currentTreatment = await Treatment.findById(treatment);
        if (!currentTreatment) return HandleError(res, 400, `Tratamento não encontrado`);

        // Busca o paciente relacionado ao tratamento
        const patient = await PatientUser.findOne({ uid: currentTreatment.patientId });
        if (!patient) return HandleError(res, 404, "Paciente não encontrado");

         // Define a paginação para os registros de medicamentos
        const limit = 10;
        const skip = page * limit;

        // Busca os históricos de medicamentos do paciente, ordenando por pendentes e data de atualização
        const medicationHistories = await PatientMedicationHistory.find({ patientId: patient.uid })
            .sort({ 'medication.pending': -1, 'medication.updatedAt': -1 })
            .limit(limit)
            .skip(skip);

        console.log(page);
        console.log(skip);
        console.log(medicationHistories);

        // Processa os históricos de medicamentos para incluir informações detalhadas
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

        // Retorna os medicamentos encontrados com sucesso
        return HandleSuccess(res, 201, "Medicamentos buscados", { medications: medications || [] });
    } catch (err) {
        console.error('Erro ao buscar histórico de medicamentos:', err.message);
        return HandleError(res, 500, `Erro ao buscar histórico de medicamentos: ${err.message}`);
    }
}
