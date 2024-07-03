const { PatientUser, DoctorUser } = require('../../../models/users');
const handleDeleteUser = require('./operations/deleteUser');
const handleInsertUser = require('./operations/insertUser');
const handleUpdateUser = require('./operations/updateUser');

const handleUserChange = async (io, change) => {
    console.log("\n\n***User Change Stream Event: ", change);

    let userModel;
    if (change.ns.coll === 'patient_forms_data') {
        userModel = PatientUser;
    } else if (change.ns.coll === 'doctor_forms_data') {
        userModel = DoctorUser;
    } else {
        return;
    }

    try
    {
        switch (change.operationType) {
            case 'insert':
                await handleInsertUser(change, io);
                break;
            case 'update':
                await handleUpdateUser(change, io);
                break;
            case 'delete':
                await handleDeleteUser(change, io);
                break;
            default:
                console.error('Tipo de operação não configurado: ', change.operationType);
        }
    }
    catch (error)
    {
        console.error('Erro ao lidar com a alteração do usuário:', error);
    }
}

const userStream = (io) => {
    const patientChangeStream = PatientUser.watch([
        { $match: { 'updateDescription.updatedFields.online': { $exists: true } } }
    ]);

    const doctorChangeStream = DoctorUser.watch([
        { $match: { 'updateDescription.updatedFields.online': { $exists: true } } }
    ]);

    patientChangeStream.on('change', change => handleUserChange(io, change));
    doctorChangeStream.on('change', change => handleUserChange(io, change));
}

module.exports = userStream;