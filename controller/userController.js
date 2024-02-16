const { PatientUser, DoctorUser } = require('../models/users');
const { handleDataText } = require('../utils/textUtils');
const { fetchUsers } = require('../services/userService');

exports.filterUsers = async (req, res) => {

    try {
        const { searchData, type, userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }
        
        console.log("Usuário autenticado: ", userId);

        if (!searchData) {
            return res.json({ success: true, data: [] });
        }

        const semiFilteredUsers = await fetchUsers(type, searchData);

        const filteredUsers = semiFilteredUsers.filter(user => {
            const userName = handleDataText(user.name);
            return handleDataText(searchData).split('').every((char, index) => userName[index]?.toLowerCase() === char);
        });

        console.log("RETORNAR: ", filteredUsers);

        return res.json({ success: true, data: filteredUsers });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro no servidor" });
    }
}

exports.userData = async (req, res) => {

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, errors: ['Usuário não autenticado'] });
        }

        const userData = await PatientUser.findById(userId) || await DoctorUser.findById(userId);

        if (!userData) {
            return res.status(400).json({ success: false, message: 'O usuário não existe' });
        }

        const authData = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            type: userData.type,
            ...(userData.doctor_crm && { doctor_crm: userData.doctor_crm }),
        }

        console.log("UserData encontrado!");
        return res.json({ success: true, data: authData })
    }
    catch (err) {
    console.error("Houve um erro no servidor ao buscar os dados: ", err);
    res.status(401).json({ success: false, error: 'Erro no servidor ao buscar os itens' });
}
}