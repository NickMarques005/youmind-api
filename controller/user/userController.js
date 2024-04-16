const { PatientUser, DoctorUser } = require('../../models/users');
const { handleDataText } = require('../../utils/textUtils');
const { fetchUsers } = require('../../services/userService');
const { getUserModel } = require("../../utils/model");
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');

exports.filterUsers = async (req, res) => {

    try {
        const { search, type } = req.query;
        const { userId } = req.user;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        let userModel = getUserModel(type);
        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const user = userModel.findById(userId);
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        if (!search) return HandleSuccess(res, 200, "Busca vazia", []);

        const semiFilteredUsers = await fetchUsers(type, search);

        const filteredUsers = semiFilteredUsers.filter(user => {
            const userName = handleDataText(user.name);
            return handleDataText(search).split('').every((char, index) => userName[index]?.toLowerCase() === char);
        });

        console.log("RETORNAR: ", filteredUsers);

        return HandleSuccess(res, 200, "Busca bem sucedida", filteredUsers);
    }
    catch (err) {
        console.error(err);
        return HandleError(res, 500, "Erro ao buscar usuários");
    }
}

exports.userData = async (req, res) => {

    try {
        const { userId } = req.user;
        const { type } = req.query;

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        let userModel = getUserModel(type);
        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const userData = await userModel.findById(userId);

        if (!userData) return HandleError(res, 404, "Usuário não encontrado");

        const authData = {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            type: userData.type,
            avatar: userData.avatar,
            ...(userData.doctor_crm && { doctor_crm: userData.doctor_crm }),
            ...(type === 'doctor' && userData.total_treatments && { total_treatments: userData.total_treatments }),
            ...(type === 'patient' && userData.is_treatment_running !== undefined && { is_treatment_running: userData.is_treatment_running })
        }

        return HandleSuccess(res, 200, "Dados do usuário encontrados com sucesso", authData);
    }
    catch (err) {
        console.error("Houve um erro no servidor ao buscar os dados: ", err);
        return HandleError(res, 500, "Erro ao buscar dados do usuário");
    }
}