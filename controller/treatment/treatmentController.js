const { PatientUser, DoctorUser } = require('../../models/users');
const Treatment = require('../../models/treatment');
const Questionnaire = require('../../models/questionnaire');
const QuestionnaireTemplate = require('../../models/questionnaire_template');
const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { getUserModel, findUserByEmail } = require("../../utils/db/model");
const { getAgenda } = require('../../agenda/agenda_manager');
const { cancelMedicationSchedules } = require('../../services/medications/medicationScheduler');
const { checkAndScheduleMedications } = require('../../services/medications/medicationScheduler');
const { addNewQuestionnaire } = require('../../services/questionnaires/addNewQuestionnaire');
const MessageTypes = require('../../utils/response/typeResponse');

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

        const agenda = getAgenda();
        const { patient, doctor } = user1.type === 'patient' ? { patient: user1, doctor: user2 } : { patient: user2, doctor: user1 };

        const existingTreatment = await Treatment.findOne({
            patientId: patient.uid,
            doctorId: doctor.uid
        });

        if (existingTreatment) {
            
            if (existingTreatment.status === 'pending') {
                
                const template = await QuestionnaireTemplate.findOne({});
                if (!template) {
                    console.log('Nenhum template de questionário encontrado.');
                    return;
                }
                await addNewQuestionnaire(existingTreatment.patientId, template._id);
                await checkAndScheduleMedications(patient.uid, agenda);
                existingTreatment.status = 'active';
                await existingTreatment.save();
                return HandleSuccess(res, 201, undefined, undefined, MessageTypes.SUCCESS);
            } 
            else if (existingTreatment.status === 'completed')
            {
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
            await checkAndScheduleMedications(patient.uid, agenda);

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
                    _id: singleTreatment._id
                }
            ];

            console.log(treatmentInfo);

            return HandleSuccess(res, 200, "Tratamento em andamento", treatmentInfo);
        }
        else {
            const treatmentPatients = await Promise.all(userTreatments.map(async (treatment) => {
                const patient = await PatientUser.findOne({ uid: treatment.patientId });
                if (!patient) return null;
                return {
                    name: patient.name,
                    email: patient.email,
                    avatar: patient.avatar,
                    phone: patient.phone,
                    birth: patient.birth,
                    gender: patient.gender,
                    uid: patient.uid,
                    online: patient.online,
                    _id: treatment._id
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

        await PatientMedicationHistory.deleteMany({
            patientId: treatmentToUpdate.patientId,
            'medication.pending': true
        });

        const patientHistoryQuestionnaires = await PatientQuestionnaireHistory.find({
            patientId: treatmentToUpdate.patientId,
            'questionnaire.pending': true
        });

        const questionnaireIds = patientHistoryQuestionnaires.map(phq => phq.questionnaire.questionnaireId);

        await Questionnaire.deleteMany({ _id: { $in: questionnaireIds } });

        await PatientQuestionnaireHistory.deleteMany({
            patientId: treatmentToUpdate.patientId,
            'questionnaire.pending': true
        });

        await PatientUser.findOneAndUpdate({ uid: treatmentToUpdate.patientId }, { is_treatment_running: false });

        treatmentToUpdate.status = 'completed';
        treatmentToUpdate.wasCompleted = true;
        await treatmentToUpdate.save();

        const patient = await PatientUser.findOne({ uid: treatmentToUpdate.patientId });
        if (!patient) return HandleError(res, 404, "Paciente ou médico não encontrado");

        const treatment = {
            name: patient.name,
            email: patient.email,
            avatar: patient.avatar,
            phone: patient.phone,
            birth: patient.birth,
            gender: patient.gender,
            uid: patient.uid,
            online: patient.online,
            _id: treatmentToUpdate._id
        }

        return HandleSuccess(res, 200, "Tratamento excluído com sucesso", { treatmentToUpdate: treatment }, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error('Erro ao encerrar o tratamento:', err);
        return HandleError(res, 500, "Erro ao encerrar o tratamento");
    }
}