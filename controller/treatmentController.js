const treatment = require('../models/treatment');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

exports.initializeTreatment = async (req, res) => {
    try {
        const { email_1, email_2, userId } = req.body;

        console.log("\n---Usuário autorizado...---\nid: ", userId);

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

        let user_patient;
        let user_doctor;

        const emails = [
            email_1,
            email_2
        ]
        console.log("REGISTER TREATMENT:");
        console.log(`EMAILS: email 1 -> ${email_1} email 2 -> ${email_2}`);

        for (const email of emails) {
            let user;
            console.log("Email: ", email);
            if (email === email_1 && email === email_2) {
                return res.status(400).json({ success: false, errors: ["E-mails iguais não são permitidos"] });
            }

            user = await patient_model.findOne({ email: email }, { _id: 1, type: 1 });
            if (!user) {
                console.log("Não achou!");
                user = await doctor_model.findOne({ email: email }, { _id: 1, type: 1, total_treatments: 1 });
                if (!user) {
                    return res.status(400).json({ success: false, errors: ["E-mail não registrado"] });
                }
            }
            console.log("USUÁRIO: ", user)

            if (user.type == "patient") {
                if (user_patient) {
                    console.log("Ambos são pacientes");
                    return res.status(400).json({ success: false, errors: ["Houve um erro, ambos são pacientes."] })
                }
                user_patient = user;
                console.log("PACIENTE: ", user_patient);
            }
            else {
                user_doctor = user;
                console.log(user_doctor);
            }
        }

        const patient_id = user_patient._id;
        const doctor_id = user_doctor._id;

        console.log("IDS: ", patient_id, doctor_id);

        const existingTreatment = await treatment.find({
            patientId: patient_id,
            doctorId: doctor_id
        });

        console.log("EXISTING TREATMENT: ", existingTreatment);

        if (existingTreatment.length > 0) {
            return res.status(400).json({ success: false, errors: ["Tratamento já iniciado"] });
        }

        const newTreatment = new treatment({
            patientId: user_patient._id,
            doctorId: user_doctor._id
        });

        await newTreatment.save();

        const new_total_treatment = [...user_doctor.total_treatments, user_patient.email];

        await patient_model.findByIdAndUpdate(user_patient._id, { is_treatment_running: true });
        await doctor_model.findByIdAndUpdate(user_doctor._id, { total_treatments: new_total_treatment });

        console.log("Tratamento feito com sucesso!");

        return res.status(200).json({ success: true, message: "Tratamento iniciado com sucesso!" });
    }
    catch (err) {
        console.error("Erro ao inicializar o tratamento: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
}

exports.getTreatment = async (req, res) => {

    try {

        const { type, userId } = req.body;

        console.log("\n---Usuário autorizado...---\nid: ", userId);

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

        if (type === "patient") {
            const patientTreatment = await treatment.find({
                patientId: userId
            });

            console.log("TRATAMENTOS: ", patientTreatment);

            if (patientTreatment.length == 0) {
                return res.status(200).json({ success: false, message: "Não há tratamento sendo feito no momento" })
            }

            let treatment_doctor = [];

            for (const treatment of patientTreatment) {
                const doctor = await doctor_model.findOne({
                    _id: treatment.doctorId
                }, { _id: 0, name: 1, email: 1 });
                console.log(doctor);

                const new_doctor = {
                    name: doctor.name,
                    email: doctor.email,
                    _id: treatment._id,
                }
                treatment_doctor.push(new_doctor);
                console.log("Doctor: ", new_doctor);
            }

            console.log(treatment_doctor);
            if (treatment_doctor.length > 1) {
                return res.status(400).json({ success: false, message: "Houve um problema, paciente está associado a mais de um médico" });
            }

            return res.status(200).json({ success: true, data: treatment_doctor, message: "Está sendo feito tratamento no momento" })
        }
        else {

            console.log("TYPE DOCTOR!");

            const doctorTreatment = await treatment.find({
                doctorId: userId
            });

            console.log("TRATAMENTOS: ", doctorTreatment);

            if (doctorTreatment.length == 0) {
                return res.status(200).json({ success: false, message: "Não  há tratamento sendo feito no momento" });
            }

            let treatment_patients = []

            for (const treatment of doctorTreatment) {
                const patient = await patient_model.findOne({
                    _id: treatment.patientId
                }, { _id: 0, name: 1, email: 1 });

                const new_patient = {
                    name: patient.name,
                    email: patient.email,
                    _id: treatment._id,
                }
                console.log("Patient: ", new_patient);

                treatment_patients.push(new_patient);

            }

            console.log(treatment_patients);

            return res.status(200).json({ success: true, data: treatment_patients, message: "Está sendo feito tratamento no momento" })
        }
    }
    catch (err) {
        console.error('Erro ao verificar o tratamento:', err);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
}

exports.deleteTreatment = async (req, res) => {
    

    try {
        
        const { treatmentId, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }
        
        console.log("\n---Usuário autorizado...---\nid: ", userId);
        
        
        if (!treatmentId) {
            return res.status(400).json({ success: false, errors: ['Tratamento não especificado'] });
        }

        const patient_model = users.PatientUser;
        const doctor_model = users.DoctorUser;

        const user = (decodedToken.user.type === 'patient') ?
            await patient_model.findById(userId) :
            await doctor_model.findById(userId);

        if (!user) {
            return res.status(404).json({ errors: ["Usuário não encontrado"] });
        }
        console.log(treatmentId);

        const existingTreatment = await treatment.findOne({ _id: treatmentId });

        if (!existingTreatment) {
            return res.status(404).json({ success: false, errors: ["Tratamento não encontrado"] });
        }

        if (
            (decodedToken.user.type === 'patient' && existingTreatment.patientId.toString() !== userId) ||
            (decodedToken.user.type === 'doctor' && existingTreatment.doctorId.toString() !== userId)
        ) {
            return res.status(403).json({ success: false, errors: ["Você não possui permissão para excluir este tratamento! "] });
        }



        const deleteTreatment = await treatment.findByIdAndDelete(treatmentId);

        if (!deleteTreatment) {
            return res.status(404).json({ success: false, errors: ["Tratamento não encontrado"] });
        }

        if (decodedToken.user.type === 'patient') {
            await patient_model.findByIdAndUpdate(userId, { is_treatment_running: false });
        } else {
            const patientId = existingTreatment.patientId;
            await patient_model.findByIdAndUpdate(patientId, { is_treatment_running: false });
        }

        let remainingTreatments = [];

        if (decodedToken.user.type === 'patient') {
            remainingTreatments = await treatment.find({ patientId: userId });
        }
        else {
            remainingTreatments = await treatment.find({ doctorId: userId });
        }

        console.log("Remaining Treatments: ", remainingTreatments);

        return res.status(200).json({ success: true, message: 'Tratamento excluído com sucesso!', data: remainingTreatments });
    }
    catch (err) {
        console.error('Erro ao excluir o tratamento:', err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor'] });
    }
}