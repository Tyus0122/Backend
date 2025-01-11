const twilio = require("twilio")
async function sendOtp(phoneNumber, otp) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const serviceId = process.env.TWILIO_SERVICE_ID
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);
        await client.messages.create({
            body: `Otp for Friendzy login : ${otp}`,
            messagingServiceSid: serviceId,
            to: phoneNumber, // Verified number
        });

    }
    catch (error) {
        console.error("Error sending OTP:", error.message);
    }
}
async function phoneNumberLookup(phoneNumber) {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio Account SID
        const authToken = process.env.TWILIO_AUTH_TOKEN;   // Your Twilio Auth Token
        const client = twilio(accountSid, authToken);

        const phoneDetails = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({
            type: ["carrier", "caller-name"], // Optional, adds carrier or caller name details
        });
        return phoneDetails; // Returns true if valid, false otherwise
    } catch (error) {
        console.error("Error validating phone number:", error.message);
        return false;
    }
}
module.exports = {
    sendOtp,
    phoneNumberLookup
}