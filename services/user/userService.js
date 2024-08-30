const Treatment = require('../../models/treatment');
const { DoctorUser, PatientUser } = require('../../models/users');
const { handleDataText } = require('../../utils/text/textUtils');

const fetchUsers = async (type, searchData) => {
    try {
        const convertedData = handleDataText(searchData);
        const modelUser = type === 'patient' ? DoctorUser : PatientUser;
        const userField = type === 'patient' ? { total_treatments: 1 } : type === 'doctor' ? { is_treatment_running: 1 } : {};

        const users = await modelUser.find(
            {
                name: { $regex: new RegExp(`${convertedData}`, 'i') },
                verified: true
            },
            {
                _id: 1,
                uid: 1,
                name: 1,
                type: 1,
                avatar: 1,
                ...userField
            }
        ).limit(30);

        if (type === 'doctor') {
            const usersWithTreatments = await Promise.all(users.map(async (user) => {
                if (user.total_treatments && user.total_treatments.length > 0) {
                    const treatmentIds = user.total_treatments;
                    const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

                    const patientIds = treatments.map(treatment => treatment.patientId);
                    const patients = await PatientUser.find({ uid: { $in: patientIds } }, { name: 1, avatar: 1, email: 1 });

                    user.total_treatments = patients.map(patient => ({
                        name: patient.name,
                        avatar: patient.avatar,
                        private: patient.private,
                        ...(patient.private ? {} : { email: patient.email })
                    }));
                }
                return user;
            }));
            return usersWithTreatments;
        }

        return users;
    }
    catch (err) {
        console.error("Houve um erro inesperado ao buscar usuários: ", err);
    }
};

const formatUserData = async (type, userId) => {
    try {
        const modelUser = type === 'doctor' ? DoctorUser : PatientUser;
        const userField = type === 'doctor' ? { total_treatments: 1 } : type === 'patient' ? { is_treatment_running: 1 } : {};

        const userSelected = await modelUser.findById(userId,
            {
                email: 1,
                online: 1,
                birth: 1,
                gender: 1,
                phone: 1,
                private: 1,
                ...userField
            });

        if (!userSelected) {
            throw new Error("Usuário não encontrado");
        }

        /*
        ### Se for tipo paciente irá buscar dados do paciente
        */
        if (type === 'patient') {
            if (userSelected.private) {
                return {
                    online: userSelected.online,
                    private: userSelected.private,
                    ...(userSelected.is_treatment_running && { is_treatment_running: userSelected.is_treatment_running })
                }
            }

            return {
                email: userSelected.email,
                online: userSelected.online,
                birth: userSelected.birth,
                gender: userSelected.gender,
                online: userSelected.online,
                phone: userSelected.phone,
                private: userSelected.private,
                ...(userSelected.is_treatment_running && { is_treatment_running: userSelected.is_treatment_running })
            }
        }
        /*
        ### Se for tipo doutor então buscar dados de doutor
        */
        else {
            if (userSelected.total_treatments.length > 0) {
                const treatmentIds = userSelected.total_treatments;
                const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

                const patientIds = treatments.map(treatment => treatment.patientId);
                const patients = await PatientUser.find({ uid: { $in: patientIds } }, { name: 1, avatar: 1, email: 1 });
                userSelected.total_treatments = patients.map(patient => ({
                    name: patient.name,
                    avatar: patient.avatar,
                    private: patient.private,
                    ...(patient.private ? {} : { email: patient.email })
                }));
            }

            if (userSelected.private) {
                return {
                    online: userSelected.online,
                    private: userSelected.private,
                    ...(userSelected.total_treatments && { total_treatments: userSelected.total_treatments }),
                }
            }

            return {
                email: userSelected.email,
                online: userSelected.online,
                birth: userSelected.birth,
                gender: userSelected.gender,
                online: userSelected.online,
                phone: userSelected.phone,
                private: userSelected.private,
                ...(userSelected.total_treatments && { total_treatments: userSelected.total_treatments }),
            }
        }
    }
    catch (err) {
        console.error("Houve um erro ao buscar e formatar usuário selecionado: ", err);
        throw err;
    }
}

module.exports = { fetchUsers, formatUserData };