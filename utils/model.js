const users = require('../models/users');

exports.getUserModel = (type, res) => {

    let model;

    switch (type) {
        case "patient":
            model = users.PatientUser;
            break;
        case "doctor":
            model = users.DoctorUser;
            break;
        default:
            console.log(
                "Algo deu errado em criar usuário! Schema não especificado"
            );
            break;
    }

    return model;
}