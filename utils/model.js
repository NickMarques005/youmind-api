const { PatientUser, DoctorUser } = require('../models/users');

exports.getUserModel = (type) => {

    let model;

    switch (type) {
        case "patient":
            model = PatientUser;
            break;
        case "doctor":
            model = DoctorUser;
            break;
        default:
            console.log(
                "Algo deu errado em criar usuário! Schema não especificado"
            );
            model = undefined;
            break;
    }

    return model;
}

exports.findUserByEmail = (email) => {
    return PatientUser.findOne({ email }) || DoctorUser.findOne({ email });
}