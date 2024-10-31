import variables from '../variables';
import { logger } from './logger.utility';
import twilio from 'twilio';

const accountSid = variables.services.twilio.accountSid;
const authToken = variables.services.twilio.authToken;

const client = twilio(accountSid, authToken);

export const sendOtpToUser = async (to: string) => {
  try {
    const verification = await client.verify.v2.services('VA8f1b3d4713f5f1d711df316b9469ccbe').verifications.create({
      to: to, // Phone number to send verification code to
      channel: 'sms' // Verification channel: 'sms' or 'call'
    });
    return verification.status;
  } catch (error) {
    console.error(error);
    logger.error('Error sending sms(otp)', error);
  }
};

export const verifyOtp = async (to: string, otp: string) => {
  try {
    const verificationCheck = await client.verify.v2.services('VA8f1b3d4713f5f1d711df316b9469ccbe').verificationChecks.create({
      to: to, // Phone number to check verification code against
      code: otp // Code entered by the user
    });
    return verificationCheck.status;
  } catch (error) {
    console.error(error);
    logger.error('Error verifying sms', error);
  }
};

// export const sendSmsToUser = async (to: string, body: string) => {
//   try {
//     const messageResponse = await client.messages.create({
//       from: accountSid,
//       body: body,
//       to
//     });
//     console.log(`Message sent! SID: ${messageResponse.sid}`);
//   } catch (error) {
//     console.error(error);
//     logger.error('Error sending sms(sms)', error);
//   }
// };
