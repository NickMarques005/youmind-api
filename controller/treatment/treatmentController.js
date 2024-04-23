const treatment = require('../../models/treatment');
const { PatientUser, DoctorUser } = require('../../models/users');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');
const { getUserModel } = require("../../utils/model");
const MessageTypes = require('../../utils/typeResponse');

exports.initializeTreatment = async (req, res) => {
    try {
        const { userId } = req.user;
        const { email_1, email_2 } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");
        if (email_1 === email_2) return HandleError(res, 400, "E-mails iguais não são permitidos");

        console.log("REGISTER TREATMENT:");
        console.log(`EMAILS: email 1 -> ${email_1} email 2 -> ${email_2}`);

        const users = await Promise.all([findUserByEmail(email_1), findUserByEmail(email_2)]);

        const [user1, user2] = users;

        if (!user1 || !user2) return HandleError(res, 400, "Um ou ambos os e-mails não registrados");
        if (user1.type === user2.type) return HandleError(res, 400, "Ambos os usuários não podem ser do mesmo tipo");

        const { patient, doctor } = user1.type === 'patient' ? { patient: user1, doctor: user2 } : { patient: user2, doctor: user1 };

        const existingTreatment = await treatment.find({
            patientId: patient._id,
        });

        console.log("EXISTING TREATMENT: ", existingTreatment);

        if (existingTreatment.length > 0) return HandleError(res, 400, "Paciente já possui tratamento em andamento");

        const newTreatment = new treatment({ patientId: patient._id, doctorId: doctor._id });

        await newTreatment.save();

        await PatientUser.findByIdAndUpdate(patient._id, { is_treatment_running: true });
        await DoctorUser.findByIdAndUpdate(doctor._id, { $addToSet: { total_treatments: patient.email } });

        console.log("Tratamento iniciado com sucesso!");

        return HandleSuccess(res, 200, "Tratamento iniciado com sucesso", newTreatment, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error("Erro ao inicializar o tratamento: ", err);
        return HandleError(res, 500, "Erro ao inicializar o tratamento");
    }
}

exports.getTreatment = async (req, res) => {

    try {

        const { userId } = req.user;
        const { type } = req.query;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        const treatmentKey = type === 'patient' ? 'patientId' : 'doctorId';
        const userTreatments = await treatment.find({ [treatmentKey]: userId });

        if (userTreatments.length === 0) return HandleSuccess(res, 200, "Não há tratamentos em andamento");

        if (type === 'patient') {
            const singleTreatment = userTreatments[0];
            const doctor = await DoctorUser.findById(singleTreatment.doctorId, { name: 1, email: 1 });
            if (!doctor) return HandleError(res, 404, "médico do tratamento não encontrado");

            const treatmentInfo = {
                name: doctor.name,
                email: doctor.email,
                _id: singleTreatment._id
            };

            return HandleSuccess(res, 200, "Tratamento em andamento", { treatmentInfo });
        }
        else {
            const treatmentPatients = await Promise.all(userTreatments.map(async (treatment) => {
                const patient = await PatientUser.findById(treatment.patientId);
                if (!patient) return null;
                return {
                    name: patient.name,
                    email: patient.email,
                    _id: treatment._id
                };
            }))

            const filteredPatients = treatmentPatients.filter(patient => patient !== null);
            return HandleSuccess(res, 200, "Tratamento(s) em andamento", { filteredPatients });
        }
    }
    catch (err) {
        console.error('Erro ao verificar o tratamento:', err);
        return HandleError(res, 500, "Erro ao buscar tratamento(s)");
    }
}

exports.deleteTreatment = async (req, res) => {

    try {
        const { userId } = req.user;
        const { treatmentId, type } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");
        if (!treatmentId) return HandleError(res, 400, 'Tratamento não especificado');

        const userModel = getUserModel(type);
        const user = await userModel.findById(userId);

        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const treatmentToDelete = await treatment.findOne({ _id: treatmentId });

        if (!treatmentToDelete) return HandleError(res, 404, "Tratamento não encontrado");

        if (type === 'doctor' && treatmentToDelete.doctorId.toString() !== userId) {
            return HandleError(res, 401, "Não possui autorização para excluir o tratamento");
        }

        await treatment.findByIdAndDelete(treatmentId);
        await PatientUser.findByIdAndUpdate(treatmentToDelete.patientId, { is_treatment_running: false });

        return HandleSuccess(res, 200, "Tratamento excluído com sucesso", { treatmentId }, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error('Erro ao excluir o tratamento:', err);
        return HandleError(res, 500, "Erro ao excluir o tratamento");
    }
}