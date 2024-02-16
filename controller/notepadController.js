const noteModel = require('../models/note');

exports.createNewNote = async (req, res) => {
    try {

        const { title, description, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        if (!title || !description) {
            return res.status(400).json({ success: false, errors: ['Titulo ou descrição inválido'] });
        }

        const newNote = new noteModel({
            title: title,
            description: description,
            doctor_id: userId,
        });

        const savedNote = await newNote.save();

        return res.status(200).json({ success: true, message: "Nota criada com sucesso!" });

    }
    catch (err) {
        console.error("Erro no servidor: ", err);
        res.status(500).send('Houve um erro no servidor');
    }
};

exports.readNotes = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const notes = await noteModel.find({ doctor_id: userId });

        if (!notes) {
            return res.status(404).json({ success: false, errors: ['Não há notas salvas'] });
        }

        return res.status(200).json({ success: true, data: notes });

    } catch (err) {
        console.error(err);
        res.status(500).send('Houve um erro interno no servidor');
    }
};

exports.deleteNote = async (req, res) => {
    try {

        const { note_id, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        if (!note_id) {
            return res.status(400).json({ success: false, errors: ["Nota não especificada"] });
        }

        const deletedNote = await noteModel.findOneAndDelete({ _id: note_id, doctor_id: userId });

        if (!deletedNote) {
            return res.status(404).send('Nota não encontrada');
        }

        return res.status(200).json({ success: true, message: "Nota excluída com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Houve um erro interno no servidor');
    }
};