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

        if (type === 'patient') {
            
            const usersDoctors = await Promise.all(users.map(async (user) => {
                let doctorTotalTreatments = [];

                if (user.total_treatments && user.total_treatments.length > 0) {
                    const treatmentIds = user.total_treatments;
                    const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

                    const patientIds = treatments.map(treatment => treatment.patientId);
                    const patients = await PatientUser.find({ uid: { $in: patientIds } }, { name: 1, avatar: 1, email: 1 });

                    doctorTotalTreatments = patients.map(patient => ({
                        name: patient.name,
                        avatar: patient.avatar,
                        private: patient.private,
                        ...(patient.private ? {} : { email: patient.email })
                    }));
                }
                
                return {
                    ...user.toObject(),
                    ...(doctorTotalTreatments && { total_treatments: doctorTotalTreatments }),
                };
            }));

            return usersDoctors;
        }
        else {
            const usersPatients = await Promise.all(users.map(async (user) => {
                let currentTreatmentDoctor = null;

                if (user.is_treatment_running) {
                    const currentTreatment = await Treatment.findOne({ patientId: user.uid, status: "active" });
                    if (currentTreatment) {
                        const doctor = await DoctorUser.findOne({ uid: currentTreatment.doctorId }, { name: 1, avatar: 1, email: 1, private: 1 });
                        currentTreatmentDoctor = doctor ? {
                            name: doctor.name,
                            avatar: doctor.avatar,
                            private: doctor.private,
                            ...(doctor.private ? {} : { email: doctor.email })
                        } : null;
                    }
                }

                return {
                    ...user.toObject(),
                    ...(currentTreatmentDoctor && { doctor: currentTreatmentDoctor }),
                    ...(user.is_treatment_running && { is_treatment_running: user.is_treatment_running })
                };
            }));

            return usersPatients;
        }
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
                uid: 1,
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
            let currentTreatmentDoctor;

            if (userSelected.is_treatment_running) {
                const currentTreatment = await Treatment.findOne({ patientId: userSelected.uid, status: "active" });
                if (currentTreatment) {
                    const doctor = await DoctorUser.findOne({ uid: currentTreatment.doctorId }, { name: 1, avatar: 1, email: 1, private: 1 });
                    currentTreatmentDoctor = doctor ? { 
                        name: doctor.name, 
                        avatar: doctor.avatar,
                        private: doctor.private,
                        ...(doctor.private ? {} : { email: doctor.email })
                    } : null;
                }
            }

            if (userSelected.private) {
                return {
                    online: userSelected.online,
                    private: userSelected.private,
                    ...(currentTreatmentDoctor && { doctor: currentTreatmentDoctor }),
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
                ...(currentTreatmentDoctor && { doctor: currentTreatmentDoctor }),
                ...(userSelected.is_treatment_running && { is_treatment_running: userSelected.is_treatment_running })
            }
        }
        /*
        ### Se for tipo doutor então buscar dados de doutor
        */
        else {
            let doctorTotalTreatments;

            if (userSelected.total_treatments.length > 0) {
                const treatmentIds = userSelected.total_treatments;
                const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

                const patientIds = treatments.map(treatment => treatment.patientId);
                const patients = await PatientUser.find({ uid: { $in: patientIds } }, { name: 1, avatar: 1, email: 1 });
                doctorTotalTreatments = patients.map(patient => ({
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
                    ...(doctorTotalTreatments && { total_treatments: doctorTotalTreatments }),
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
                ...(doctorTotalTreatments && { total_treatments: doctorTotalTreatments }),
            }
        }
    }
    catch (err) {
        console.error("Houve um erro ao buscar e formatar usuário selecionado: ", err);
        throw err;
    }
}

module.exports = { fetchUsers, formatUserData };