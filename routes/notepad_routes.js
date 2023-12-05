const router = require("express").Router();
const Note = require('../models/note');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;
const mongoose = require('mongoose');

router.post('/createNewNote', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, errors: ['Titulo ou descrição inválido'] });
        }

        const newNote = new Note({
            title: title,
            description: description,
            doctor_id: userId,
        });

        const savedNote = await newNote.save();

        return res.status(200).json({ success: true, message: "Nota criada com sucesso!" });

    }
    catch (erro) {
        console.error("Erro no servidor: ", err);
        res.status(500).send('Houve um erro no servidor');
    }
});

router.post('/readNotes', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const notes = await Note.find({ doctor_id: userId });
        
        if(!notes){
            return res.status(404).json({success: false, errors: ['Não há notas salvas']});
        }

        return res.status(200).json({success: true, data: notes});

    } catch (err) {
        console.error(err);
        res.status(500).send('Houve um erro interno no servidor');
    }
});

router.post('/deleteNote', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }
    
    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;
        const { note_id } = req.body;

        if(!note_id)
        {
            return res.status(400).json({success: false, errors: ["Nota não especificada"]});
        }

        const deletedNote = await Note.findOneAndDelete({ _id: note_id, doctor_id: userId });

        if (!deletedNote) {
            return res.status(404).send('Nota não encontrada');
        }

        return res.status(200).json({success: true, message: "Nota excluída com sucesso"});
    } catch (err) {
        console.error(err);
        res.status(500).send('Houve um erro interno no servidor');
    }
});

module.exports = router;



