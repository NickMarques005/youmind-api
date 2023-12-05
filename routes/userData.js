//---userData.js---//

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//Chave principal para assinar os tokens JWT.
const jwt_mainKey = require('../config').jwt_key;
const users = require('../models/users');

router.get('/userData', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ error: "Não autorizado" });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;
        const patient_data = await users.PatientUser.findById(userId);

        if (patient_data) {

            const auth_data = {
                id: patient_data._id,
                name: patient_data.name,
                email: patient_data.email,
                phone: patient_data.phone,
                type: patient_data.type
            }

            return res.json({success: true, data: auth_data})
        }
        else {
            const doctor_data = await users.DoctorUser.findById(userId);

            if (!doctor_data) {
                return res.status(400).json({ success: false, message: 'O usuário não existe' });
            }

            const auth_data = {
                id: doctor_data._id,
                name: doctor_data.name,
                email: doctor_data.email,
                phone: doctor_data.phone,
                doctor_crm: doctor_data.doctor_crm,
                type: doctor_data.type,
                connected: true
            }
            console.log("userData encontrado!");
            return res.json({success: true, data: auth_data})
        }
    }
    catch (err) {
        console.error("Houve um erro no servidor ao buscar os dados: ", err);
        res.status(401).json({ success: false, error: 'Erro no servidor ao buscar os itens' });
    }
});

module.exports = router;