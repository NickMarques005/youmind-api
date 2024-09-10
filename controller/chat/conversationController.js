const treatment = require('../../models/treatment');
const Message = require('../../models/message');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { findUserByEmail } = require('../../utils/db/model');
const Note = require('../../models/note');

exports.getConversationTreatment = async (req, res) => {
    try {
        const { uid } = req.user;
        const { email_1, email_2 } = req.query;

        if (!uid) return HandleError(res, 401, 'Usuário não autorizado');

        if (!email_1 || !email_2) return HandleError(res, 400, "Emails inválidos. Tente novamente");
        if (email_1 === email_2) return HandleError(res, 400, "E-mail iguais não são permitidos");

        console.log("EMAILS: ", email_1, email_2);

        const users = await Promise.all([
            findUserByEmail(email_1),
            findUserByEmail(email_2)
        ]);

        console.log(users);

        const user_patient = users.find(user => user && user.type === "patient");
        console.log(user_patient);

        const user_doctor = users.find(user => user && user.type === "doctor");
        console.log(user_doctor);

        if (!user_patient || !user_doctor) return HandleError(res, 404, "Usuários não encontrados ou tipo de usuário inválido");

        const patient_id = user_patient.uid;
        const doctor_id = user_doctor.uid;

        const existingTreatment = await treatment.findOne({
            patientId: patient_id,
            doctorId: doctor_id
        });

        if (!existingTreatment) return HandleError(res, 404, "Tratamento não encontrado");
        const treatmentId = existingTreatment._id;

        return HandleSuccess(res, 200, "Tratamento encontrado", treatmentId);
    }
    catch (err) {
        console.error("Algo deu errado em pegar conversa: ", err);
        return HandleError(res, 500, "Erro ao buscar conversa");
    }
};

exports.saveNewMessage = async (req, res) => {
    try {
        const { conversationId, content, audioUrl, duration, senderType } = req.body;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");
        if (!conversationId || !content) return HandleError(res, 400, 'Houve um erro ao postar mensagem');

        const id_verification = await treatment.findById(conversationId);
        if (!id_verification) return HandleError(res, 400, 'A conversa de tratamento não existe');

        const new_message = {
            conversationId: conversationId,
            content: content,
            sender: uid,
            senderType: senderType, 
            ...(audioUrl && { audioUrl }),
            ...(duration && { duration })
        }

        const newMessage = new Message(new_message);
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

        const { uid } = req.user;
        const { conversationId } = req.query;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        if (!conversationId) return HandleError(res, 400, 'Você não está registrado na conversa do tratamento');

        const id_verification = await treatment.findById(conversationId);
        if (!id_verification) return HandleError(res, 404, 'A conversa de tratamento não existe');

        const messages = await Message.find({
            conversationId: conversationId,
        });

        return HandleSuccess(res, 200, "Busca de mensagens feita com sucesso", messages);
    }
    catch (err) {
        console.error("Erro ao buscar mensagens: ", err);
        return HandleError(res, 500, "Erro ao buscar mensagens");
    }
};

exports.addMessagesToNote = async (req, res) => {
    try {
        const { noteId, messages } = req.body;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, 'Usuário não autorizado');
        if (!noteId || !messages || !Array.isArray(messages)) return HandleError(res, 400, 'Dados inválidos');

        // Verificação se a anotação existe
        const note = await Note.findById(noteId);
        if (!note) return HandleError(res, 404, 'Anotação não encontrada');

        // Adicionar as mensagens ao conteúdo da anotação
        note.content.push(...messages);

        // Salvando as alterações
        const updatedNote = await note.save();

        return HandleSuccess(res, 200, 'Mensagens adicionadas à anotação', updatedNote);
    } catch (err) {
        console.error('Erro ao adicionar mensagens à anotação: ', err);
        return HandleError(res, 500, `Erro ao adicionar mensagens à anotação: ${err.message}`);
    }
};