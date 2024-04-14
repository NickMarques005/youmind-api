const treatment = require('../../models/treatment');
const message = require('../../models/message');
const { PatientUser, DoctorUser } = require('../../models/users');
const mongoose = require('mongoose');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');

exports.getConversationTreatment = async (req, res) => {
    try {
        const { userId } = req.user;
        const { email_1, email_2 } = req.query;

        if (!userId) return HandleError(res, 401, 'Usuário não autorizado');

        console.log("EMAILS: ", email_1, email_2);

        if (!email_1 || !email_2) return HandleError(res, 400, "Emails inválidos. Tente novamente");


        let user_patient;
        let user_doctor;

        const emails = [
            email_1,
            email_2
        ];

        console.log(`EMAILS: ${email_1} e ${email_2}`);


        for (const email of emails) {
            let user;

            if (email === email_1 && email === email_2) {
                return HandleError(res, 400, "E-mail iguais não são permitidos");
            }

            user = await PatientUser.findOne({ email: email }, { _id: 1, type: 1 });
            if (!user) {
                user = await DoctorUser.findOne({ email: email }, { _id: 1, type: 1 });
                if (!user) {
                    return HandleError(res, 404, `E-mail ${email} não está registrado`);
                }
            }

            if (user.type === "patient") {
                if (user_patient) {
                    return HandleError(res, 400, "Ambos são pacientes");
                }
                user_patient = user;
            } else {
                if (user_doctor) {
                    return HandleError(res, 400, "Ambos são médicos");
                }
                user_doctor = user;
            }
        }

        const patient_id = user_patient._id;
        const doctor_id = user_doctor._id;

        const existingTreatment = await treatment.find({
            patientId: patient_id,
            doctorId: doctor_id
        });

        if (existingTreatment.length === 0) return HandleError(res, 404, "Tratamento não encontrado");
        const treatmentId = existingTreatment[0]._id;

        return HandleSuccess(res, 200, "Tratamento encontrado", treatmentId);
    }
    catch (err) {
        console.error("Algo deu errado em pegar conversa: ", err);
        return HandleError(res, 500, "Erro ao buscar conversa");
    }
};

exports.saveNewMessage = async (req, res) => {
    try {
        const { conversationId, content, userId } = req.body;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");
        if (!conversationId || !content) return HandleError(res, 400, 'Houve um erro ao postar mensagem');

        const conversationObjectId = new mongoose.Types.ObjectId(conversationId);
        
        const id_verification = await treatment.findById(conversationObjectId);
        if (!id_verification) return HandleError(res, 400, 'A conversa de tratamento não existe');

        const new_message = {
            conversationId: conversationId,
            content: content,
            sender: userId
        }

        const newMessage = new message(new_message);
        const savedMessage = await newMessage.save();

        return HandleSuccess(res, 200, "Mensagem salva", savedMessage);
    }
    catch (err) {
        console.error("Erro ao salvar nova mensagem: ", err);
        return HandleError(res, 500, "Erro ao salvar nova mensagem");
    }
};

exports.getMessages = async (req, res) => {
    try {

        const { userId } = req.body;
        const { conversationId } = req.query;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        if (!conversationId) return HandleError(res, 400, 'Você não está registrado na conversa do tratamento');

        const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

        const id_verification = await treatment.findById(conversationObjectId);
        if (!id_verification) return HandleError(res, 404, 'A conversa de tratamento não existe');

        const messages = await message.find({
            conversationId: conversationId,
        });

        return HandleSuccess(res, 200, "Busca de mensagens feita com sucesso", messages);
    }
    catch (err) {
        console.error("Erro ao buscar mensagens: ", err);
        return HandleError(res, 500, "Erro ao buscar mensagens");
    }
};