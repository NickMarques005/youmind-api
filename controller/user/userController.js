const { PatientUser, DoctorUser } = require('../../models/users');
const { handleDataText } = require('../../utils/text/textUtils');
const { fetchUsers } = require('../../services/user/userService');
const { getUserModel } = require("../../utils/db/model");
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const MessageTypes = require('../../utils/response/typeResponse');
const { convertToBrazilTime } = require('../../utils/date/timeZones'); 

exports.filterUsers = async (req, res) => {

    try {
        const { search, type } = req.query;
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        let userModel = getUserModel(type);
        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const user = userModel.find({ uid: uid });
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
        const { uid } = req.user;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        let user = await PatientUser.findOne({ uid: uid }) || await DoctorUser.findOne({ uid: uid });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const authenticatedUser = {
            _id: user.uid,
            name: user.name,
            email: user.email,
            phone: user.phone,
            type: user.type,
            birth: user.birth ? user.birth : undefined,
            gender: user.gender ? user.gender : undefined,
            avatar: user.avatar,
            ...(user.doctor_crm && { doctor_crm: user.doctor_crm }),
            ...(user.type === 'doctor' && user.total_treatments && { total_treatments: user.total_treatments }),
            ...(user.type === 'patient' && user.is_treatment_running !== undefined && { is_treatment_running: user.is_treatment_running })
        }

        console.log("Dados do usuário: ", authenticatedUser);

        return HandleSuccess(res, 200, `Bem-vindo ao YouMind ${user.name}! `, authenticatedUser);
    }
    catch (err) {
        console.error("Houve um erro no servidor ao buscar os dados: ", err);
        return HandleError(res, 500, "Erro ao buscar dados do usuário");
    }
}

exports.updateUserAvatar = async (req, res) => {
    try {
        const { uid } = req.user;
        const { avatar } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        let user = await PatientUser.findOne({ uid: uid }) || await DoctorUser.findOne({ uid: uid });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        user.avatar = avatar;
        await user.save();

        return HandleSuccess(res, 200, "Avatar atualizado com sucesso", { avatar: user.avatar }, MessageTypes.SUCCESS);
    } catch (err) {
        console.error("Erro ao atualizar avatar: ", err);
        return HandleError(res, 500, "Erro ao atualizar avatar");
    }
}

exports.updateUserDetails = async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, phone, gender, birth } = req.body;

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        let user = await PatientUser.findOne({ uid: uid }) || await DoctorUser.findOne({ uid: uid });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;
        if (birth) {
            const birthDate = new Date(birth);
            if (!isNaN(birthDate.getTime())) {
                user.birth = birthDate;
            } else {
                return HandleError(res, 400, "Data de nascimento inválida");
            }
        }

        await user.save();

        return HandleSuccess(res, 200, "Dados do usuário atualizados com sucesso", {
            name: user.name,
            phone: user.phone,
            gender: user.gender,
            birth: user.birth
        }, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error("Erro ao atualizar dados do usuário: ", err);
        return HandleError(res, 500, "Erro ao atualizar dados do usuário");
    }
}