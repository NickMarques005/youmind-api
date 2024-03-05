exports.generateOTP = () => {
    for (let i = 0; i <= 3; i++)
    {
        const randomValueOTP = Math.round(Math.random() * 9)
        otp = otp + randomValueOTP;
    }

    return otp;
}