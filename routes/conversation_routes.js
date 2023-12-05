const router = require("express").Router();
const treatment = require('../models/treatment');
const message = require('../models/message');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;
const mongoose = require('mongoose');

router.post('/getConversationTreatment', async (req, res) => {
    try {
        const { email_1, email_2 } = req.body;

        console.log("EMAILS: ", email_1, email_2);

        if(!email_1 || !email_2)
        {
            return res.status(400).json({success: false, errors: ["Emails inválidos. Tente novamente"]});
        }

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

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
                return res.status(400).json({ success: false, errors: ["E-mails iguais não são permitidos"] });
            }

            user = await patient_model.findOne({ email: email }, { _id: 1, type: 1 });
            if (!user) {
                user = await doctor_model.findOne({ email: email }, { _id: 1, type: 1 });
                if (!user) {
                    return res.status(400).json({ success: false, errors: ["E-mail não registrado"] });
                }
            }

            if (user.type == "patient") {
                if (user_patient) {
                    return res.status(400).json({ success: false, errors: ["Houve um erro, ambos são pacientes."] });
                }
                user_patient = user;
            } else {
                user_doctor = user;
            }
        }

        const patient_id = user_patient._id;
        const doctor_id = user_doctor._id;

        const existingTreatment = await treatment.find({
            patientId: patient_id,
            doctorId: doctor_id
        });

        

        if(existingTreatment.length === 0)
        {
            return res.status(400).json({ success: false, errors: ["Tratamento não encontrado"] });
        }

        const treatmentId = existingTreatment[0]._id;

        return res.status(200).json({ success: true, data: treatmentId})

    }
    catch {
        console.error("Algo deu errado em pegar conversa: ", err);
        return res.status(500).json({ success: false, errors: ["Houve um erro no servidor"] });
    }
});

router.post('/saveNewMessage', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }
    
    try{
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const { conversationId, content } = req.body;

        if(!conversationId || !content)
        {
            return res.status(400).json({success: false, errors: ['Houve um erro ao postar mensagem']});
        }

        const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

        const id_verification = await treatment.findById(conversationObjectId);

        if(!id_verification)
        {
            return res.status(400).json({success: false, errors: ['A conversa de tratamento não existe']});
        }
        
        const new_message = {
            conversationId: conversationId,
            content: content,
            sender: userId
        }

        const newMessage = new message(new_message);

        const savedMessage = await newMessage.save();

        return res.status(200).json({success: true, data: savedMessage});
    }
    catch (err)
    {
        console.error("Erro ao salvar nova mensagem: ", err);
        res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
    }
});

router.post('/getMessages', async (req, res) => {
    
    try{

        const { conversationId } = req.body;

        if(!conversationId)
        {
            return res.status(400).json({success: false, errors: ['Você não está registrado na conversa do tratamento']});
        }

        const conversationObjectId = new mongoose.Types.ObjectId(conversationId);

        const id_verification = await treatment.findById(conversationObjectId);

        if(!id_verification)
        {
            return res.status(400).json({success: false, errors: ['A conversa de tratamento não existe']});
        }

        const messages = await message.find({
            conversationId: conversationId,
        });

        return res.status(200).json({success: true, data: messages});
    }
    catch(err) {
        console.error("Erro ao buscar mensagens: ", err);
        res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
    }
});

module.exports = router;