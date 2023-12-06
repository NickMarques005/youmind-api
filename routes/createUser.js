//---createUser.js---//

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const users = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Chave principal para assinar os tokens JWT.
const jwt_mainKey = require('../config').jwt_key;

//Rota de Método POST para criação do Usuário

router.post('/createUser',
    body('email').isEmail(),
    body('name').isLength({ min: 3 }),
    body('password', 'Incorrect Password').isLength({ min: 8 }),
    async (req, res) => {
        //Extrai os erros dos resultados possíveis da requisição
        const errors = validationResult(req);

        //Caso haja erros na requisição então retornará os erros
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, type, phone, doctor_crm } = req.body;

        const salt_generation = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(password, salt_generation);

        try {

            if (type === 'patient') {
                console.log("TYPE USER: ", type);
                const patient_model = users.PatientUser;
                const registered = await patient_model.findOne({ email });
                if (registered) {
                    return res.status(400).json({ success: false, errors: ['O usuário já está registrado'] });
                }

                console.log("DADOS: ", name, password, phone, email, type );

                await patient_model.create({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    phone: phone,
                    type: type
                });

                console.log("Conta do usuário Paciente criada com sucesso!");
                return res.json({ success: true, message: 'Sua conta foi criada com successo!' });
            }
            else if (type === 'doctor') {
                console.log("TYPE USER: ", type);
                const doctor_model = users.DoctorUser;
                const registered = await doctor_model.findOne({ email });
                if (registered) {
                    return res.status(400).json({ success: false, errors: ['O usuário já está registrado'] });
                }

                if(!doctor_crm)
                {
                    return res.status(400).json({success: false, errors: ['Houve um erro. Registro CRM inválido']});
                }
                
                await doctor_model.create({
                    name: name,
                    email: email,
                    password: hashedPassword,
                    phone: phone,
                    doctor_crm: doctor_crm,
                    type: type
                });

                console.log("Conta do usuário Doutor criada com sucesso!");
                return res.json({ success: true, message: 'Sua conta foi criada com successo!' });

            }
            else {
                console.log('Type é inválido: ', type);
                return res.status(400).json({success: false, errors: [`Houve um erro. Tipo de usuário inválido: ${type}`]})
            }
        }
        catch (err) {
            console.error(`Erro no servidor: ${err}`);
            return res.status(500).json({ errors: ['Houve um erro no servidor ao criar usuário'] });
        }
    }
);

module.exports = router;