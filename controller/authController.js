//---authController.js---//

const config_environment = require("../config");
const users = require("../models/users");
const verification_token = require("../models/verification_token");
const reset_token = require('../models/reset_token');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOTP } = require("../utils/mail");
const { sendMailService } = require("../services/mailService");
const { isValidObjectId } = require("mongoose");

const crypto = require('crypto');
const { createRandomBytes } = require("../utils/security");


//Chaves para assinar os tokens JWT.
const jwt_mainKey = config_environment.jwt_key;
const jwt_refreshKey = config_environment.refresh_key;


const getUserModel = (type, res) => {
    switch (type) {
        case "patient":
            return users.PatientUser;
        case "doctor":
            return users.DoctorUser;
        default:
            console.log(
                "Algo deu errado em criar usuário! Schema não especificado"
            );
            return res
                .status(400)
                .json({
                    success: false,
                    errors: ["Tipo de usuário não especificado"],
                });
    }
}

exports.registerUser = async (req, res) => {
    const { name, email, password, type, phone, doctor_crm } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        let userModel;

        try {
            userModel = getUserModel(type, res);
        } catch (err) {
            console.log(err.message);
            return res.status(400).json({ success: false, errors: [err.message] });
        }

        const registered = await userModel.findOne({ email });
        if (registered) {
            return res
                .status(400)
                .json({ success: false, errors: ["O usuário já está registrado"] });
        }

        if (type === "doctor" && !doctor_crm) {
            return res
                .status(400)
                .json({ success: false, errors: ["Registro CRM inválido"] });
        }

        const OTP = generateOTP();

        console.log("OTP CRIADO: ", OTP);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            phone,
            type,
            ...(type === "doctor" && { doctor_crm }),
        });

        const verificationToken = new verification_token({
            owner: newUser._id,
            token: OTP,
        });

        await newUser.save();
        await verificationToken.save();

        sendMailService("sendVerificationEmail", {
            userData: { email: email, name: name },
            OTP: OTP,
        });

        res
            .status(200)
            .json({ success: true, message: "Sua conta foi criada com sucesso!" });
    } catch (err) {
        console.error(`Erro ao criar usuário: ${err}`);
        res
            .status(500)
            .json({ success: false, errors: ["Erro interno do servidor"] });
    }
};

exports.authenticateUser = async (req, res) => {
    const { email, password, type } = req.body;
    try {
        console.log("Login de usuário!\n");
        let userModel;

        try {
            userModel = getUserModel(type, res);
        } catch (err) {
            console.log(err.message);
            return res.status(400).json({ success: false, errors: [err.message] });
        }

        const userData = await userModel.findOne({ email });

        if (!userData) {
            return res
                .status(400)
                .json({ success: false, errors: [`Usuário não cadastrado`] });
        }

        const passwordCompare = await bcrypt.compare(password, userData.password);

        if (!passwordCompare) {
            return res
                .status(400)
                .json({ success: false, errors: ["Senha incorreta"] });
        }

        const accessTokenExpiresIn = "30s";
        const refreshTokenExpiresIn = "30d";

        const dataAuthentication = {
            user: {
                id: userData.id,
            },
        };

        const accessToken = jwt.sign(dataAuthentication, jwt_mainKey, {
            expiresIn: accessTokenExpiresIn,
        });
        const refreshToken = jwt.sign(dataAuthentication, jwt_refreshKey, {
            expiresIn: refreshTokenExpiresIn,
        });

        const accessTokenExp = new Date(new Date().getTime() + 30 * 1000);
        const refreshTokenExp = new Date(
            new Date().getTime() + 30 * 24 * 60 * 60 * 1000
        );

        const tokens = {
            accessToken: { token: accessToken, exp: accessTokenExp },
            refreshToken: { token: refreshToken, exp: refreshTokenExp },
        };

        return res
            .status(200)
            .json({
                success: true,
                message: "Login efetuado com sucesso",
                data: tokens,
            });
    } catch (err) {
        console.error("Erro ao autenticar o usuário: ", err);
        return res
            .status(500)
            .json({ success: false, errors: ["Erro interno do servidor"] });
    }
};

exports.refreshToken = async (req, res, next) => {
    const refreshToken = req.body.refreshToken;
    const refreshKey = config_environment.refresh_key;
    jwt.verify(refreshToken, refreshKey, (err, decode) => {
        if (err) {
            res.status(400).json({
                success: false,
                errors: [err],
            });
        } else {
            const jwtKey = config_environment.jwt_key;
            const accessTokenExpiresIn = "30s";

            const userId = decode.user.id;
            const data_authentication = {
                user: {
                    id: userId,
                },
            };
            const newToken = jwt.sign(data_authentication, jwtKey, {
                expiresIn: accessTokenExpiresIn,
            });
            const newTokenExp = new Date(new Date().getTime() + 30 * 1000);

            const tokens = {
                accessToken: { token: newToken, exp: newTokenExp },
                refreshToken: { token: refreshToken },
            };

            res.status(200).json({
                success: true,
                message: "Token atualizado com sucesso!",
                data: tokens,
            });
        }
    });
};

exports.logoutUser = async (req, res) => {
    try {
        const { type, userId } = req.body;

        console.log("LOGOUT USER...");

        if (!userId) {
            return res
                .status(401)
                .json({ success: false, errors: ["Usuário não autenticado"] });
        }

        console.log("Usuário a ser deslogado: ", userId);

        if (!type) {
            return res
                .status(400)
                .json({
                    success: false,
                    errors: [
                        "Houve um erro: tipo de usuário não especificado. Tente novamente.",
                    ],
                });
        }

        let userModel;

        try {
            userModel = getUserModel(type, res);
        } catch (err) {
            console.log(err.message);
            return res.status(400).json({ success: false, errors: [err.message] });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Usuário não encontrado." });
        }

        //await firebase_service.saveToken(user._id, null);

        console.log(`Usuário ${user._id} deslogado com sucesso!`)
        return res
            .status(200)
            .json({ success: true, message: "Sua conta foi deslogada com sucesso!" })

    } catch (err) {
        console.error("Erro ao deslogar usuário: ", err);
        return res
            .status(500)
            .json({ success: false, errors: ["Erro interno do servidor."] });
    }
};

exports.verifyEmail = async (req, res) => {
    const { userId, otp, type } = req.body;

    if (!userId || !otp.trim()) {
        return res
            .status(401)
            .json({
                success: false,
                errors: ["Requisição inválida: Usuário ou OTP não especificado"],
            });
    }

    if (!isValidObjectId(userId)) {
        return res
            .status(401)
            .json({ success: false, errors: ["Usuário inválido"] });
    }

    let userModel;

    try {
        userModel = getUserModel(type, res);
    } catch (err) {
        console.log(err.message);
        return res.status(400).json({ success: false, errors: [err.message] });
    }

    const user = await userModel.findById(userId);

    if (!user) {
        return res
            .status(400)
            .json({ success: false, errors: [`Usuário não cadastrado`] });
    }

    if (user.verified)
        return res
            .status(400)
            .json({
                success: false,
                errors: ["Essa conta já foi verificada! Por favor faça seu login ;)"],
            });

    const tokenOtp = await verification_token.findOne({ owner: user._id });
    if (!tokenOtp)
        return res
            .status(400)
            .json({ success: false, errors: ["Token do código OTP não encontrado"] });

    const isMatched = await tokenOtp.compareToken(otp);
    if (!isMatched)
        return res
            .status(401)
            .json({
                success: false,
                errors: ["Por favor, entre com um token válido!"],
            });

    user.verified = true;

    await verification_token.findByIdAndDelete(tokenOtp._id);
    await user.save();

    sendMailService("welcomeEmail", {
        userData: { email: user.email, name: user.name },
    });

    res
        .status(200)
        .json({ success: true, message: "Sua conta foi verificada com sucesso!" });
};

exports.forgotPassword = async (req, res) => {
    const { email, type } = req.body;
    if (!email) return res.status(401).json({ success: false, errors: ['Por favor, entre com um email válido'] });

    let userModel;

    try {
        userModel = getUserModel(type, res);
    } catch (err) {
        console.log(err.message);
        return res.status(400).json({ success: false, errors: [err.message] });
    }

    const user = await userModel.findOne({ email: email });

    if (!user) {
        return res
            .status(400)
            .json({ success: false, errors: [`Usuário não encontrado`] });
    }

    const token = await reset_token.findOne({ owner: user._id });

    if (token)
        return res
            .status(400)
            .json({ success: false, errors: [`Seu token já foi ativado para resetar sua senha há ${token.createdAt}. Só depois de uma hora você poderá requisitar novamente.`] });

    const newTokenForResetPass = await createRandomBytes();

    const resetToken = new reset_token({ owner: user._id, token: newTokenForResetPass})
    await resetToken.save();

    console.log(`URL para resetar senha: ${process.env.RESETPASS_URL}/reset-password?token=${newTokenForResetPass}&id=${user._id}`);

    sendMailService("resetPasswordEmail", {
        userData: { email: user.email, name: user.name },
        resetLink: `${process.env.RESETPASS_URL}/reset-password?token=${newTokenForResetPass}&id=${user._id}`,
    });

    return res.status(200).json({success: true, message: 'O link para resetar sua senha foi enviado para seu e-mail.'});
}
