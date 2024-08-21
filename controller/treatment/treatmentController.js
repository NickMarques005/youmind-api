const { PatientUser, DoctorUser } = require('../../models/users');
const Treatment = require('../../models/treatment');
const Questionnaire = require('../../models/questionnaire');
const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { getUserModel, findUserByEmail } = require("../../utils/db/model");
const { getAgenda } = require('../../agenda/agenda_manager');
const { cancelMedicationSchedules } = require('../../services/medications/medicationScheduler');
const MessageTypes = require('../../utils/response/typeResponse');
const { createNotice } = require('../../utils/user/notice');
const { getInitialChatData } = require('../../services/chat/chatServices');

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

        const existingTreatment = await Treatment.findOne({
            patientId: patient.uid,
            doctorId: doctor.uid
        });

        if (existingTreatment) {

            if (existingTreatment.status === 'pending') {
                existingTreatment.status = 'active';
                await existingTreatment.save();
                
                await PatientUser.findByIdAndUpdate(patient._id, { is_treatment_running: true });
                const doctorData = await DoctorUser.findById(doctor._id);
                if (!doctorData.total_treatments.includes(patient._id.toString())) {
                    await DoctorUser.findByIdAndUpdate(doctor._id, { $addToSet: { total_treatments: patient._id.toString() } });
                }
                
                return HandleSuccess(res, 201, undefined, undefined, MessageTypes.SUCCESS);
            }
            else if (existingTreatment.status === 'completed') {
                return HandleError(res, 400, "Tratamento já encerrado");
            }
            else {
                return HandleError(res, 400, "Tratamento já está em progresso");
            }
        } else {
            const newTreatment = new Treatment({
                patientId: patient.uid,
                doctorId: doctor.uid,
                status: 'active'
            });

            await newTreatment.save();

            await PatientUser.findByIdAndUpdate(patient._id, { is_treatment_running: true });
            await DoctorUser.findByIdAndUpdate(doctor._id, { $addToSet: { total_treatments: patient._id.toString() } });

            return HandleSuccess(res, 201, undefined, undefined, MessageTypes.SUCCESS);
        }
    } catch (err) {
        console.error("Erro ao inicializar o tratamento: ", err);
        return HandleError(res, 500, "Erro ao inicializar o tratamento");
    }
}


exports.getTreatment = async (req, res) => {
    console.log("Get Treatment!!");
    try {

        const { uid } = req.user;
        const { type } = req.query;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!type) return HandleError(res, 400, "Tipo de usuário não definido");

        const treatmentKey = type === 'patient' ? 'patientId' : 'doctorId';
        const userTreatments = await Treatment.find({ [treatmentKey]: uid, status: "active" });
        console.log("GET TREATMENTS");
        if (userTreatments.length === 0) return HandleSuccess(res, 200, "Não há tratamentos em andamento");

        if (type === 'patient') {
            const singleTreatment = userTreatments[0];
            const doctor = await DoctorUser.findOne({ uid: singleTreatment.doctorId });
            if (!doctor) return HandleError(res, 404, "médico do tratamento não encontrado");

            const chatData = await getInitialChatData(singleTreatment._id, uid);

            const treatmentInfo = [
                {
                    name: doctor.name,
                    email: doctor.email,
                    avatar: doctor.avatar,
                    phone: doctor.phone,
                    birth: doctor.birth,
                    gender: doctor.gender,
                    uid: doctor.uid,
                    online: doctor.online,
                    _id: singleTreatment._id,
                    chat: chatData || undefined
                }
            ];

            return HandleSuccess(res, 200, "Tratamento em andamento", treatmentInfo);
        }
        else {
            const treatmentPatients = await Promise.all(userTreatments.map(async (treatment) => {
                const patient = await PatientUser.findOne({ uid: treatment.patientId });
                if (!patient) return null;

                const chatData = await getInitialChatData(treatment._id, uid);

                return {
                    name: patient.name,
                    email: patient.email,
                    avatar: patient.avatar,
                    phone: patient.phone,
                    birth: patient.birth,
                    gender: patient.gender,
                    uid: patient.uid,
                    online: patient.online,
                    _id: treatment._id,
                    chat: chatData
                };
            }));

            console.log(treatmentPatients);

            const filteredPatients = treatmentPatients.filter(patient => patient !== null);
            return HandleSuccess(res, 200, "Tratamento(s) em andamento", filteredPatients);
        }
    }
    catch (err) {
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

        await cancelMedicationSchedules(treatmentToUpdate.patientId, agenda);

        /*
        ### Atualizar todos os históricos da medicação que estiverem pending true para delete true
        */
        const medicationUpdateResult = await PatientMedicationHistory.updateMany(
            { patientId: treatmentToUpdate.patientId, 'medication.pending': true },
            { $set: { delete: true } }
        );

        console.log(`Total de ${medicationUpdateResult.nModified} patient medication history atualizados para delete: true`);

        /*
        ### Excluir questionários do paciente que estiverem pendentes
        */
        const patientHistoryQuestionnaires = await PatientQuestionnaireHistory.find({
            patientId: treatmentToUpdate.patientId,
            'questionnaire.pending': true
        });

        const questionnaireIds = patientHistoryQuestionnaires.map(phq => phq.questionnaire.questionnaireId);

        await Questionnaire.deleteMany({ _id: { $in: questionnaireIds } });

        /*
        ### Atualizar históricos relacionados a esse paciente para tipo delete
        */
        const questionnaireUpdateResult = await PatientQuestionnaireHistory.updateMany(
            { _id: { $in: questionnaireIds } },
            { $set: { delete: true } }
        );

        console.log(`Total de ${questionnaireUpdateResult.nModified} patient questionnaire history atualizados para delete: true`);


        await PatientUser.findOneAndUpdate({ uid: treatmentToUpdate.patientId }, { is_treatment_running: false });

        treatmentToUpdate.status = 'completed';
        treatmentToUpdate.wasCompleted = true;
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
    try{
        const { uid } = req.user;
        const { treatmentId } = req.params;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        
        const treatment = await Treatment.findById(treatmentId);
        if (!treatment) return HandleError(res, 404, "Tratamento não encontrado");
        
        if(treatment.status !== 'active') return HandleError(res, 400, "O tratamento não foi iniciado");

        return HandleSuccess(res, 200);
    }
    catch (err)
    {
        console.error('Erro ao verificar tratamento:', err);
        return HandleError(res, 500, `Erro ao verificar inicialização tratamento: ${err}`);
    }
}

exports.verifyTreatmentCompletion = async (req, res) => {
    try{
        const { uid } = req.user;
        const { treatmentId } = req.params;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        
        const treatment = await Treatment.findById(treatmentId);
        if (!treatment) return HandleError(res, 404, "Tratamento não encontrado");
        
        if(treatment.status !== 'completed') return HandleError(res, 400, "O tratamento não foi encerrado");

        return HandleSuccess(res, 200);
    }
    catch (err)
    {
        console.error('Erro ao verificar tratamento:', err);
        return HandleError(res, 500, `Erro ao verificar encerramento do tratamento: ${err}`);
    }
}

