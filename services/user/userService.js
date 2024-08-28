//---userService.js---//

const Treatment = require('../../models/treatment');
const { DoctorUser, PatientUser } = require('../../models/users');
const { handleDataText } = require('../../utils/text/textUtils');

const fetchUsers = async (type, searchData) => {
    const convertedData = handleDataText(searchData);
    const modelUser = type === 'patient' ? DoctorUser : PatientUser;
    const searchField = type === 'patient' ? { total_treatments: 1 } : type === 'doctor' ? { is_treatment_running: 1 } : {};

    const users = await modelUser.find(
        {
            name: { $regex: new RegExp(`${convertedData}`, 'i') },
            verified: true
        },
        { _id: 1, uid: 1, name: 1, email: 1, phone: 1, type: 1, avatar: 1, birth: 1, gender: 1, ...searchField }
    ).limit(30);

    if(type === 'patient'){
        const updatedUsers = await Promise.all(users.map(async user => {
            const newUser = {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                type: user.type,
                avatar: user.avatar,
                birth: user.birth,
                gender: user.gender
            };

            if (user.total_treatments.length > 0) {
                const treatmentIds = user.total_treatments;
                const treatments = await Treatment.find({ _id: { $in: treatmentIds } });

                const patientIds = treatments.map(treatment => treatment.patientId);
                const patients = await PatientUser.find({ _id: { $in: patientIds } }, { name: 1, avatar: 1, email: 1 });
                newUser.total_treatments = patients.map(patient => ({ 
                    name: patient.name,
                    avatar: patient.avatar, 
                    email: patient.email 
                }));
            }

            return newUser;

        }));

        console.log(updatedUsers);

        return updatedUsers;
    }
    else {

        const updatedUsers = await Promise.all(users.map(async user => {
            const newUser = {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                type: user.type,
                avatar: user.avatar,
                birth: user.birth,
                gender: user.gender,
                is_treatment_running: user.is_treatment_running
            };

            if (user.is_treatment_running) {
                console.log("Treatment Running");
                const currentTreatment = await Treatment.findOne({ patientId: user.uid, status: "active" });
                if (currentTreatment) {
                    console.log("Salvar dados do doutor");
                    const doctor = await DoctorUser.findOne({ uid: currentTreatment.doctorId }, { name: 1, avatar: 1, email: 1 });
                    newUser.doctor = doctor ? { name: doctor.name, avatar: doctor.avatar, email: doctor.email } : null;
                }
            }

            return newUser;
        }));

        return updatedUsers;
    }
};

module.exports = { fetchUsers };