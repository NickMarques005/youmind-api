//---userService.js---//

const { DoctorUser, PatientUser} = require('../models/users');
const { handleDataText } = require('../utils/textUtils');

const fetchUsers = async (type, searchData) => {
    const convertedData = handleDataText(searchData);
    const modelUser = type === 'patient' ? DoctorUser : PatientUser;
    const searchField = type === 'patient' ? { total_treatments: 1 } : { is_treatment_running: 1};
    
    return await modelUser.find(
        { name: {$regex: new RegExp(`${convertedData}`, 'i')}},
        { _id: 1, name: 1, email: 1, phone: 1, type: 1, avatar: 1, ...searchField}
    ).limit(40);
};

module.exports = { fetchUsers };