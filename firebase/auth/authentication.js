const { firebase_auth } = require('../firebase_config');

const createUser = async (email, password) => {
    try{
        const userRecord = await firebase_auth.createUser({
            email: email,
            password: password
        });

        return { success: true, data: userRecord };
    }
    catch (err)
    {
        console.error("Erro ao criar novo usuário no Firebase: ", err);
        throw err;
    }
}

const getUser = async (uid) => {
    try{
        const userRecord = await firebase_auth.getUser(uid);
        return { success: true, data: userRecord };
    }
    catch (err)
    {
        console.error("Erro ao buscar dados do usuário: ", err);
        
    }
}

const changeUserPassword = async (uid, newPassword) => {
    try{
        const userRecord = await firebase_auth.updateUser(uid, {
            password: newPassword
        });
        return { success: true, data: userRecord };
    }
    catch (err)
    {
        console.error("Erro ao trocar senha do firebase: ", err);
        return { success: false, error: err };
    }
}

const deleteUser = async (uid) => {
    try{
        await firebase_auth.deleteUser(uid);
        console.log("Usuário deletado com sucesso do firebase");
    }
    catch (err){
        console.error("Erro ao deletar usuário: ", err);
        return { success: false, error: err };
    }
}

const updateUser = async (uid, email, password) => {
    try {
        const userRecord = await firebase_auth.updateUser(uid, {
            email: email,
            password: password
        });
        return userRecord;
    } catch (err) {
        console.error('Error updating user:', err);
        return { success: false, error: err };
    }
}

module.exports = {
    createUser, 
    getUser,
    changeUserPassword,
    deleteUser,
    updateUser
}



