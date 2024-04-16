const noteModel = require('../../models/note');
const { DoctorUser } = require('../../models/users');

exports.createNewNote = async (req, res) => {
    try {

        const { title, description } = req.body;
        const { userId } = req.user;

        const doctor = DoctorUser.findById(userId);

        if(!doctor) return HandleError(res, 404, "Médico não encontrado");

        if (!title || !description) return HandleError(res, 400, 'Titulo ou descrição inválido');

        const newNote = new noteModel({
            title: title,
            description: description,
            doctor_id: userId,
        });

        const savedNote = await newNote.save();

        console.log("Nota salva: ", savedNote);

        return HandleSuccess(res, 200, "Nota criada com sucesso", savedNote);

    }
    catch (err) {
        console.error("Erro no servidor: ", err);
        return HandleError(res, 500, "Erro ao salvar nota");
    }
};

exports.readNotes = async (req, res) => {
    try {
        const { userId } = req.user;

        const doctor = DoctorUser.findById(userId);
        if(!doctor) return HandleError(res, 404, "Médico não encontrado");

        const notes = await noteModel.find({ doctor_id: userId });

        return HandleSuccess(res, 200, "Notas encontradas", notes);

    } catch (err) {
        console.error("Erro ao buscar notas: ", err);
        return HandleError(res, 500, "Erro ao buscar notas");
    }
};

exports.deleteNote = async (req, res) => {
    try {

        const { noteId } = req.body;
        const { userId } = req.user;

        const doctor = DoctorUser.findById(userId);
        if(!doctor) return HandleError(res, 404, "Médico não encontrado");

        if (!noteId) return HandleError(res, 400, "Nota não especificada. Tente novamente");

        const deletedNote = await noteModel.findOneAndDelete({ _id: noteId, doctor_id: userId });

        if (!deletedNote) {
            return HandleError(res, 404, "Nota não encontrada");
        }

        return HandleSuccess(res, 200, "Nota deletada com sucesso", { deletedNote: deletedNote._id});
    } catch (err) {
        console.error(err);
        return HandleError(res, 500, "Erro ao deletar nota");
    }
};