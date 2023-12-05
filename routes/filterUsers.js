//----filterUsers.js----//

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//Chave principal para assinar os tokens JWT.
const jwt_mainKey = require('../config').jwt_key;

const { PatientUser, DoctorUser } = require('../models/users');

const removeAccents = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

router.post('/filterUsers', async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Não autorizado"] });
    }
    
    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;
        
        const { searchData, type } = req.body;

        if (!searchData)
        {
            return res.json({success: true, data: []});
        }

        function handleDataText(value) {
            return removeAccents(value.toLowerCase());
        }

        const converted_data = handleDataText(searchData);
        let semi_filtered_users;

        if (type === 'patient') {
            console.log("Searching doctors for:", converted_data);
            semi_filtered_users = await DoctorUser.find(
                { name: { $regex: new RegExp(`${converted_data}|${converted_data.toUpperCase()}`, 'i')} },
                { _id: 1, name: 1, email: 1, phone: 1, type: 1, total_treatments: 1 }
            ).limit(40);

            console.log(semi_filtered_users);

        } else if (type === 'doctor') {
            console.log("Searching patients for:", converted_data);
            semi_filtered_users = await PatientUser.find(
                { name: { $regex: new RegExp(`${converted_data}|${converted_data.toUpperCase()}`, 'i')} },
                { _id: 1, name: 1, email: 1, phone: 1, type: 1, is_treatment_running: 1 }
            ).limit(40);

            console.log(semi_filtered_users);
        }
        else {
            return res.status(400).json({ message: "Tipo de usuário inválido" });
        }

        console.log(semi_filtered_users);

        const filtered_users = semi_filtered_users.filter(user => {
            const user_name = handleDataText(user.name);
            const search_name = handleDataText(searchData);

            // Verificar se cada caractere na string de pesquisa está na posição correta no nome do usuário
            return search_name.split('').every((char, index) => {
                return user_name[index].toLowerCase() === char.toLowerCase();
            });
        });

        console.log("RETORNAR: ", filtered_users);

        return res.json({ success: true, data: filtered_users });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro no servidor" });
    }
});

module.exports = router;