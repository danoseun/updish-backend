import variables from '../variables';
import { logger } from './logger.utility';

const mailchimp = require('@mailchimp/mailchimp_transactional')(variables.services.mailchimp.apiKey);

//message object format

// const message = {
//     from_email: variables.services.mailchimp.senderEmail,
//     subject: "Hello world",
//     text: "Welcome to Mailchimp Transactional!",
//     to: [
//       {
//         email: "justthinking54@gmail.com",
//         type: "to"
//       }
//     ]
//   };

export const emailSender = async (message: object) => {
  try {
    const response = await mailchimp.messages.send({
      message
    });
    console.log('email response', response);
    //return response;
  } catch (error) {
    console.error(error);
    logger.error('Error sending email:', error);
  }
};
