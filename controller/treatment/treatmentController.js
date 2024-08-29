const { PatientUser, DoctorUser } = require('../../models/users');
const Treatment = require('../../models/treatment');
const Questionnaire = require('../../models/questionnaire');
const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { getUserModel, findUserByEmail } = require("../../utils/db/model");
const { getAgenda } = require('../../agenda/agenda_manager');
const { cancelAllMedicationSchedules } = require('../../services/medications/medicationScheduler');
const MessageTypes = require('../../utils/response/typeResponse');
const { createNotice } = require('../../utils/user/notice');
const { getInitialChatData } = require('../../services/chat/chatServices');
const TreatmentRequest = require('../../models/solicitation_treatment');
const Notification = require('../../models/notification');
const { calculateTreatmentOverallPerformance } = require('../../services/treatment/performance/performanceServices');
const { formatTreatment } = require('../../services/treatment/treatmentFormatting');

exports.initializeTreatment = async (req, res) => {
    try {
        const { uid } = req.user;
        const { email_1, email_2 } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (email_1 === email_2) return HandleError(res, 400, "E-mails iguais não são permitidos");

        console.log("REGISTER TREATMENT:");
        console.log(`EMAILS: email 1 -> ${email_1} email 2 -> ${email_2}`);

        const users = await Promise.all([findUserByEmail(email_1), findUserByEmail(email_2)]);

        const [user1, user2] = users;
        console.log(users);

        if (!user1 || !user2) return HandleError(res, 400, "Um ou ambos os e-mails não registrados");
        if (user1.type === user2.type) return HandleError(res, 400, "Ambos os usuários não podem ser do mesmo tipo");

        const { patient, doctor } = user1.type === 'patient' ? { patient: user1, doctor: user2 } : { patient: user2, doctor: user1 };

        /*
        ### Verifica se o tratamento com ambos o paciente e doutor já existe
        */
        const existingTreatment = await Treatment.findOne({
            patientId: patient.uid,
        });

        if (existingTreatment) {
            if (existingTreatment.doctorId !== undefined && existingTreatment.status === "active") {
                return HandleError(res, 400, "Tratamento já está em progresso");
            }
            else if (existingTreatment.status === 'completed') {
                //Criar nova sessão
                const newSession = {
                    engagedDoctor: {
                        uid: doctor.uid,
                        name: doctor.name,
                    },
                    period: {
                        start: new Date(),
                    }
                };

                await Treatment.findByIdAndUpdate(existingTreatment._id, {
                    $set: {
                        status: 'active',
                        doctorId: doctor.uid
                    },
                    $push: {
                        sessions: newSession
                    },
                    updatedAt: Date.now()
                });
            }
        }
        else {
            /*
            ### Cria novo tratamento
            */
            const newTreatment = new Treatment({
                patientId: patient.uid,
                doctorId: doctor.uid,
                status: 'active',
                sessions: [{
                    engagedDoctor: {
                        _id: doctor._id,
                        name: doctor.name,
                        gender: doctor.gender
                    },
                    period: {
                        start: new Date(),
                    }
                }],
            });

            await newTreatment.save();

            /*
            ### Adiciona o novo tratamento na lista de tratamentos executados por esse doutor se não estiver
            */

            const doctorData = await DoctorUser.findById(doctor._id);
            if (!doctorData.total_treatments.includes(newTreatment._id.toString())) {
                await DoctorUser.findByIdAndUpdate(doctor._id, { $addToSet: { total_treatments: newTreatment._id.toString() } });
            }
        }

        /*
        ### Configura "tratamento em andamento" para o usuário
        */
        await PatientUser.findByIdAndUpdate(patient._id, { is_treatment_running: true });

        /*
        ### Apaga todas as solicitações entre o paciente e outros doutores:
        */
        await TreatmentRequest.deleteMany({
            patientId: patient.uid
        });

        /*
        ### Exclui as notificações relacionadas ao tratamento e solicitações para o paciente
        */
        await Notification.deleteMany({
            user: patient.uid,
            notify_type: 'treatment',
            notify_function: 'solicitation'
        });

        return HandleSuccess(res, 201, undefined, undefined, MessageTypes.SUCCESS);
    } catch (err) {
        console.error("Erro ao inicializar o tratamento: ", err);
        return HandleError(res, 500, "Erro ao inicializar o tratamento");
    }
}

exports.getTreatment = async (req, res) => {
    try {
        const { uid } = req.user;
        const { type } = req.query;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!type) return HandleError(res, 400, "Tipo de usuário não definido");

        const treatmentKey = type === 'patient' ? 'patientId' : 'doctorId';
        const userTreatments = await Treatment.find({ [treatmentKey]: uid, status: { $in: ["active", "completed"] } });

        if (type === 'patient') {
            if (userTreatments.length === 0) return HandleSuccess(res, 200, "Não há tratamentos registrados");

            const singleTreatment = userTreatments[0];

            const formattedTreatment = await formatTreatment(singleTreatment, type);
            if (!formattedTreatment) return HandleError(res, 404, "Erro ao formatar tratamento");

            const treatmentData = [ 
                formattedTreatment
            ]

            return HandleSuccess(res, 200, "Tratamento em andamento", treatmentData);
        } else {
            const doctor = await DoctorUser.findOne({ uid: uid });
            if (!doctor) return HandleError(res, 404, "Você não foi encontrado nos registros de doutores");

            /*
            ### Buscar tratamentos adicionais usando os IDs do campo `total_treatments` do doutor
            */
            const additionalTreatments = await Treatment.find({
                _id: { $in: doctor.total_treatments },
                status: { $in: ["active", "completed"] }
            });

            /*
            ### Combinar tratamentos encontrados em `userTreatments` e `additionalTreatments`
            */
            const allTreatments = [...new Map([...userTreatments, ...additionalTreatments].map(treatment => [treatment._id.toString(), treatment])).values()];
            if (allTreatments.length === 0) return HandleSuccess(res, 200, "Não há tratamentos em andamento");

            const formattedTreatments = await Promise.all(allTreatments.map(treatment => formatTreatment(treatment, type)));

            const filteredPatients = formattedTreatments.filter(patient => patient !== null);
            return HandleSuccess(res, 200, "Tratamento(s) em andamento", filteredPatients);
        }
    } catch (err) {
        console.error('Erro ao verificar o tratamento:', err);
        return HandleError(res, 500, "Erro ao buscar tratamento(s)");
    }
}

exports.endTreatment = async (req, res) => {

    try {
        const { uid } = req.user;
        const { treatmentId, type } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!treatmentId) return HandleError(res, 400, 'Tratamento não especificado');

        const userModel = getUserModel(type);
        const user = await userModel.findOne({ uid: uid });

        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const treatmentToUpdate = await Treatment.findOne({ _id: treatmentId });
        if (!treatmentToUpdate) return HandleError(res, 404, "Tratamento não encontrado");

        if (type === 'doctor' && treatmentToUpdate.doctorId.toString() !== uid) {
            return HandleError(res, 401, "Não possui autorização para encerrar o tratamento");
        }

        const agenda = getAgenda();
        /*
        ### Medicamentos: Cancelamento de todos os agendamentos 
        */
        await cancelAllMedicationSchedules(treatmentToUpdate.patientId, agenda);

        /*
        ### Medicamentos: Atualizar todos os históricos da medicação que estiverem pending true para delete true
        */
        const medicationUpdateResult = await PatientMedicationHistory.updateMany(
            { patientId: treatmentToUpdate.patientId, 'medication.pending': true },
            { $set: { delete: true } }
        );
        console.log(`Total de ${medicationUpdateResult.nModified} patient medication history atualizados para delete: true`);


        /*
        ### Questionários: Excluir questionários do paciente que estiverem pendentes
        */
        const patientHistoryQuestionnaires = await PatientQuestionnaireHistory.find({
            patientId: treatmentToUpdate.patientId,
            'questionnaire.pending': true
        });

        const questionnaireIds = patientHistoryQuestionnaires.map(phq => phq.questionnaire.questionnaireId);

        await Questionnaire.deleteMany({ _id: { $in: questionnaireIds } });

        /*
        ### Questionários: Atualizar históricos de questionários relacionados a esse paciente para tipo delete
        */
        const questionnaireUpdateResult = await PatientQuestionnaireHistory.updateMany(
            { 'questionnaire.questionnaireId': { $in: questionnaireIds } },
            { $set: { delete: true } }
        );

        console.log(`Total de ${questionnaireUpdateResult.nModified} patient questionnaire history atualizados para delete: true`);

        /*
        ### Atualizar o paciente para não estar mais com tratamento em andamento
        */
        await PatientUser.findOneAndUpdate({ uid: treatmentToUpdate.patientId }, { is_treatment_running: false });

        /*
        ### Calcular o desempenho final do tratamento
        */
        const finalPerformance = await calculateTreatmentOverallPerformance(treatmentToUpdate.patientId);

        /*
        ### Atualizar o tratamento para completo e ajustar a sessão atual
        */
        const lastSessionIndex = treatmentToUpdate.sessions.length - 1;

        if (lastSessionIndex >= 0) {
            const lastSession = treatmentToUpdate.sessions[lastSessionIndex];
            lastSession.period.end = new Date();
            lastSession.finalPerformance = finalPerformance;
        }

        if (!treatmentToUpdate.wasCompleted) {
            treatmentToUpdate.wasCompleted = true;
        }

        treatmentToUpdate.status = 'completed';
        await treatmentToUpdate.save();

        return HandleSuccess(res, 200, undefined, undefined, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error('Erro ao encerrar o tratamento:', err);
        return HandleError(res, 500, "Erro ao encerrar o tratamento");
    }
}

exports.welcomeTreatment = async (req, res) => {
    try {
        const { uid } = req.user;
        const { type } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!type) return HandleError(res, 400, "Tipo de usuário não definido");

        const userModel = type === 'patient' ? PatientUser : DoctorUser;
        const user = await userModel.findOne({ uid });

        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        if (!user.welcomeTreatment) {
            return HandleError(res, 400, "Usuário não possui o aviso ativado");
        }

        let message;
        if (type === 'patient') {
            const treatment = await Treatment.findOne({ patientId: uid, status: 'active' });

            if (!treatment) return HandleError(res, 404, "Tratamento não encontrado");

            if (treatment.wasCompleted) {
                const doctor = await DoctorUser.findOne({ uid: treatment.doctorId });
                if (!doctor) return HandleError(res, 404, "Médico não encontrado");
                message = `Parabéns por retomar o tratamento com ${doctor.name}! Gostaria de ver novamente as instruções de como funciona o processo de tratamento no YouMind?`;
            } else {
                message = `Parabéns por iniciar o tratamento com seu médico! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
            }
        } else {
            const treatments = await Treatment.find({ doctorId: uid, status: 'active' });
            if (treatments.length === 0) return HandleError(res, 404, "Tratamentos não encontrados");

            if (treatments.length > 1) {
                message = `Parabéns por mais um tratamento iniciado! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
            } else {
                const patient = await PatientUser.findOne({ uid: treatments[0].patientId });
                if (!patient) return HandleError(res, 404, "Paciente não encontrado");

                message = `Parabéns por iniciar o tratamento com seu paciente! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
            }
        }

        const notice = createNotice({
            message,
            type: "welcome",
            dontshow: true,
            acceptText: "Sim",
            declineText: "Não, Obrigado"
        });

        return HandleSuccess(res, 200, "Mensagem de boas-vindas enviada", notice, MessageTypes.SUCCESS);
    } catch (err) {
        console.error('Erro ao remover mensagem de boas-vindas:', err);
        return HandleError(res, 500, "Erro ao remover mensagem de boas-vindas");
    }
}

exports.removeWelcomeTreatment = async (req, res) => {
    try {
        const { uid } = req.user;
        const { type } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!type) return HandleError(res, 400, "Tipo de usuário não definido");

        const userModel = type === 'patient' ? PatientUser : DoctorUser;
        const user = await userModel.findOne({ uid });

        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        user.welcomeTreatment = false;
        await user.save();

        return HandleSuccess(res, 200, "Mensagem de boas-vindas removida com sucesso", undefined, MessageTypes.SUCCESS);
    } catch (err) {
        console.error('Erro ao remover mensagem de boas-vindas:', err);
        return HandleError(res, 500, "Erro ao remover mensagem de boas-vindas");
    }
}

exports.verifyTreatmentInitialization = async (req, res) => {
    try {
        const { uid } = req.user;
        const { treatmentId } = req.params;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const treatment = await Treatment.findById(treatmentId);
        if (!treatment) return HandleError(res, 404, "Tratamento não encontrado");

        if (treatment.status !== 'active') return HandleError(res, 400, "O tratamento não foi iniciado");

        return HandleSuccess(res, 200);
    }
    catch (err) {
        console.error('Erro ao verificar tratamento:', err);
        return HandleError(res, 500, `Erro ao verificar inicialização tratamento: ${err}`);
    }
}

exports.verifyTreatmentCompletion = async (req, res) => {
    try {
        const { uid } = req.user;
        const { treatmentId } = req.params;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        const treatment = await Treatment.findById(treatmentId);
        if (!treatment) return HandleError(res, 404, "Tratamento não encontrado");

        if (treatment.status !== 'completed') return HandleError(res, 400, "O tratamento não foi encerrado");

        return HandleSuccess(res, 200);
    }
    catch (err) {
        console.error('Erro ao verificar tratamento:', err);
        return HandleError(res, 500, `Erro ao verificar encerramento do tratamento: ${err}`);
    }
}

