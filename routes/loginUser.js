//---loginUser.js---//

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const users = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Chave principal para assinar os tokens JWT.
const jwt_mainKey = require('../config').jwt_key;
console.log("KEY ALEATORIA PRINCIPAL: ", jwt_mainKey);

router.post('/loginUser', body('email', 'E-mail incorreto').isEmail(),
    body('password', 'Senha incorreta').isLength({ min: 8 }),
    async (req, res) => {
        //Extrai os erros dos resultados possíveis da requisição
        const errors = validationResult(req);

        //Caso haja erros na requisição então retornará os erros
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, type } = req.body;

        try {
            if (!type) {
                return res.status(400).json({ success: false, errors: ["Tipo de usuário inválido"] });
            }

            if (type === "patient") {
                const patient_data = await users.PatientUser.findOne({ email });

                if (!patient_data) {
                    return res.status(400).json({ success: false, message: 'Paciente não encontrado.' });
                }

                const password_compare = await bcrypt.compare(password, patient_data.password)

                if (!password_compare) {
                    return res.status(400).json({ success: false, message: 'Senha incorreta' });
                }

                const data_authentication = {
                    user: {
                        id: patient_data.id,
                    }
                }

                const authToken = jwt.sign(data_authentication, jwt_mainKey);
                console.log("Conta do usuário encontrada! Dados do usuário:\nE-mail: ", patient_data.email, "\nNome: ", patient_data.name, "\nTelefone: ", patient_data.phone, "\nID: ", patient_data.id);

                return res.json({ success: true, data: authToken });

            }
            else if (type === 'doctor') {
                const doctor_data = await users.DoctorUser.findOne({ email });

                if (!doctor_data) {
                    return res.status(400).json({ success: false, message: 'Médico não encontrado.' });
                }

                const password_compare = await bcrypt.compare(password, doctor_data.password)

                if (!password_compare) {
                    return res.status(400).json({ success: false, message: 'Senha incorreta' });
                }

                const data_authentication = {
                    user: {
                        id: doctor_data.id,
                    }
                }

                const authToken = jwt.sign(data_authentication, jwt_mainKey);
                console.log("Conta do usuário encontrada! Dados do usuário:\nE-mail: ", doctor_data.email, "\nNome: ", doctor_data.name, "\nTelefone: ", doctor_data.phone, "\nCRM: ", doctor_data.doctor_crm, "\nID: ", doctor_data.id);

                return res.json({ success: true, data: authToken });

            }


        }
        catch (err) {
            console.error("Houve um erro no servidor ao fazer a autenticação: ", err);
            return res.json({ success: false, message: 'Houve um erro no servidor' });
        }
    }
);

module.exports = router;



