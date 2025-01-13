const twilio = require("twilio")
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const serviceId = process.env.TWILIO_SERVICE_ID
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
async function sendOtp(phoneNumber, otp) {
    // try {
    //     let sent = await client.messages.create({
    //         body: `Otp for Friendzy login : ${otp}`,
    //         messagingServiceSid: serviceId,
    //         to: phoneNumber, // Verified number
    //     });
    //     console.log(JSON.stringify(sent,null,2));

    // }
    // catch (error) {
    //     console.error("Error sending OTP:", error.message);
    // }
    try {
        await client.verify.v2
            .services(serviceId) // Replace with your Service SID
            .verifications.create({
                channel: "sms",
                to: phoneNumber,
            });
        console.log("OTP sent!");
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
}
async function verifyOTP(to, code) {
    try {
        const verificationCheck = await client.verify.v2
            .services(serviceId) // Replace with your Service SID
            .verificationChecks.create({
                to: to,
                code: code,
            });
        if (verificationCheck.status === "approved" && verificationCheck.valid) {
            console.log("Verification successful!");
            return true;
        } else {
            console.log("Verification failed!");
            return false;
        }
    } catch (error) {
        console.error("Error verifying OTP:", error.message);
        return false;
    }
}
async function getLastOTP(toPhoneNumber) {
    try {
      // Fetch messages sent to the specific number
      const messages = await client.messages.list({
        to: toPhoneNumber, // The recipient's phone number
        limit: 1, // Get the most recent message
      });
  
      if (messages.length > 0) {
        const lastMessage = messages[0];
        console.log("Last OTP sent:", lastMessage.body);
      } else {
        console.log("No messages found for this number.");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }
async function phoneNumberLookup(phoneNumber) {
    try {

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
    verifyOTP,
    getLastOTP,
    phoneNumberLookup
}