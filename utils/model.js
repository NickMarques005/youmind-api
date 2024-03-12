const users = require('../models/users');

exports.getUserModel = (type, res) => {
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