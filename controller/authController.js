//---authController.js---//

const express = require('express');
const config_environment = require('../config');
const users = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Chaves para assinar os tokens JWT.
const jwt_mainKey = config_environment.jwt_key;
const jwt_refreshKey = config_environment.refresh_key;

exports.registerUser = async (req, res) => {
    const { name, email, password, type, phone, doctor_crm } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        let userModel;
        switch (type) {
            case 'patient':
                break;
            case 'doctor':
                break;
            default:
                break;
        }

        const registered = await userModel.findOne({ email });
        if (registered) {
            return res.status(400).json({ success: false, message: 'O usuário já está registrado' });
        }

        if (type === 'doctor' && !doctor_crm) {
            return res.status(400).json({ success: false, message: 'Registro CRM inválido' });
        }

        await userModel.create({
            name,
            email,
            password: hashedPassword,
            phone,
            ...(type === 'doctor' && { doctor_crm })
        });

        res.json({ success: true, message: 'Sua conta foi criada com sucesso!' });
    }
    catch (err) {
        console.error(`Erro ao criar usuário: ${err}`);
        res.status(500).json({ success: false, message: 'Houve um erro no servidor ao criar usuário' });
    }
}

exports.authenticateUser = async (req, res) => {
    const { email, password, type } = req.body;



    try {
        let userData;

        switch (type) {
            case 'patient':
                userData = await users.PatientUser.findOne({ email });
                break;
            case 'doctor':
                userData = await users.DoctorUser.findOne({ email });
                break;
            default:
                return res.status(400).json({ success: false, message: "Tipo de usuário inválido" });
        }

        if (!userData) {
            return res.status(400).json({ success: false, message: `${type.charAt(0).toUpperCase() + type.slice(1)} não encontrado.` })
        }

        const passwordCompare = await bcrypt.compare(password, userData.password);

        if (!passwordCompare) {
            return res.status(400).json({ success: false, message: "Senha incorreta" });
        }

        const accessTokenExpiresIn = '30s'; 
        const refreshTokenExpiresIn = '30d';

        const dataAuthentication = {
            user: {
                id: userData.id,
            }
        };

        const accessToken = jwt.sign(dataAuthentication, jwt_mainKey, { expiresIn: accessTokenExpiresIn });
        const refreshToken = jwt.sign(dataAuthentication, jwt_refreshKey, { expiresIn: refreshTokenExpiresIn });

        const accessTokenExp = new Date(new Date().getTime() + 30*1000);
        const refreshTokenExp = new Date(new Date().getTime() + 30*24*60*60*1000);

        const tokens = {
            accessToken: {token: accessToken, exp: accessTokenExp},
            refreshToken: {token: refreshToken, exp: refreshTokenExp}
        }

        return res.status(200).json({ success: true, message: "Login efetuado com sucesso", data: tokens });

    }
    catch (err) {
        console.error("Erro ao autenticar o usuário: ", err);
        return res.status(500).json({ success: false, message: "Houve um erro no servidor" });
    }
}


exports.refreshToken = async (req, res, next) => {
    const refreshToken = req.body.refreshToken;
    const refreshKey = config_environment.refresh_key;
    jwt.verify(refreshToken, refreshKey, (err, decode) => {
        if (err) {
            res.status(400).json({
                success: false,
                errors: [err]
            })
        }
        else {
            const jwtKey = config_environment.jwt_key;
            const accessTokenExpiresIn = '30s';
            
            const userId = decode.user.id;
            const data_authentication = {
                user: {
                    id: userId
                }
            }
            const newToken = jwt.sign(data_authentication, jwtKey, { expiresIn: '30s' });
            const newTokenExp = new Date(new Date().getTime() + 30*1000);

            const tokens = {
                accessToken: { token: newToken, exp: newTokenExp},
                refreshToken: { token: refreshToken }
            }

            res.status(200).json({
                success: true,
                message: 'Token atualizado com sucesso!',
                data: tokens
            });
        }
    });
}

exports.logoutUser = async (req, res) => {

    try {

        const { type, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        console.log("Usuário a ser deslogado: ", userId);

        if (!type) {
            return res.status(400).json({ success: false, errors: ['Houve um erro: tipo de usuário não especificado. Tente novamente.'] });
        }
        if (type === 'patient') {
            const user = await users.PatientUser.findById(userId);

            if (!user) {
                return res.status(400).json({ success: false, message: 'Usuário não encontrado.' });
            }

            //await firebase_service.saveToken(userId, null);

            console.log(`Usuário ${userId} deslogado com sucesso!`);
            return res.status(200).json({ success: true, message: 'Logout bem-sucedido!' });
        }
        else {
            const user = await users.DoctorUser.findById(userId);

            if (!user) {
                return res.status(400).json({ success: false, message: 'Usuário não encontrado.' });
            }

            //await firebase_service.saveToken(userId, null);

            console.log(`Usuário ${userId} deslogado com sucesso!`);
            return res.status(200).json({ success: true, message: 'Logout bem-sucedido!' });
        }
    }
    catch (err) {
        console.error("Erro ao deslogar usuário: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};