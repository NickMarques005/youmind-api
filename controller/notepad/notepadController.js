const noteModel = require('../../models/note');
const { DoctorUser } = require('../../models/users');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { MessageTypes } = require('../../utils/response/typeResponse');

exports.createNewNote = async (req, res) => {
    try {

        const { title, description } = req.body;
        const { uid } = req.user;

        const doctor = DoctorUser.findById(uid);

        if (!doctor) return HandleError(res, 404, "Médico não encontrado");

        if (!title) return HandleError(res, 400, 'Titulo ou descrição inválido');

        const newNote = new noteModel({
            title,
            description,
            doctor_id: uid,
        });

        const savedNote = await newNote.save();

        console.log("Nota salva: ", savedNote);

        return HandleSuccess(res, 200, "Nota criada com sucesso", savedNote, MessageTypes.SUCCESS);

    }
    catch (err) {
        console.error("Erro no servidor: ", err);
        return HandleError(res, 500, "Erro ao salvar nota");
    }
};

exports.readNotes = async (req, res) => {
    try {
        const { uid } = req.user;
        const doctor = DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Médico não encontrado");
        const notes = await noteModel.find({ doctor_id: uid });
        return HandleSuccess(res, 200, "Notas encontradas", notes);

    } catch (err) {
        console.error("Erro ao buscar notas: ", err);
        return HandleError(res, 500, "Erro ao buscar notas");
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content } = req.body;
        const { uid } = req.user;

        const doctor = await DoctorUser.find({uid: uid});
        if (!doctor) return HandleError(res, 404, "Médico não encontrado");

        if (!id) return HandleError(res, 400, "Nota não especificada. Tente novamente");

        const noteToUpdate = await noteModel.findById(id);
        if (!noteToUpdate) {
            return res.status(404).json({ message: "Nota não encontrada" });
        }

        noteToUpdate.title = title || noteToUpdate.title;
        noteToUpdate.description = description || noteToUpdate.description;
        noteToUpdate.content = content || noteToUpdate.content;

        const updatedNote = await noteToUpdate.save();

        if (!updatedNote) {
            return HandleError(res, 404, "Nota não encontrada");
        }

        return HandleSuccess(res, 200, "Nota atualizada com sucesso", { updatedNote }, MessageTypes.SUCCESS);
    } catch (err) {
        console.error("Erro ao atualizar a nota: ", err);
        return HandleError(res, 500, "Erro ao atualizar nota");
    }
};

exports.deleteNote = async (req, res) => {
    try {

        const { id } = req.params;
        const { uid } = req.user;

        const doctor = DoctorUser.findOne({ uid: uid });
        if (!doctor) return HandleError(res, 404, "Médico não encontrado");

        if (!id) return HandleError(res, 400, "Nota não especificada. Tente novamente");

        const deletedNote = await noteModel.findOneAndDelete({ _id: id, doctor_id: uid });

        if (!deletedNote) {
            return HandleError(res, 404, "Nota não encontrada");
        }

        return HandleSuccess(res, 200, "Nota deletada com sucesso", { deletedNote: deletedNote._id }, MessageTypes.SUCCESS);
    } catch (err) {
        console.error(err);
        return HandleError(res, 500, "Erro ao deletar nota");
    }
};