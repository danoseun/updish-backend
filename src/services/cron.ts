//import { CronJob } from 'cron';
// import { getBookingsWithEndDatePassed, updateBookingStatus } from '../repository/bookings';
// import { fetchPendingTransactions } from '../repository/bookings';
// import { verifyTransaction } from './paystack.utility';
// import { BOOKING_STATUS, LISTING_STATUS } from '../constants';
// import { Booking, Transaction, User } from '../interfaces';


// export const getBookingsWithEndDatePassedCron = (): void => {
//   //runs at 4 am daily
//   //review this cron to run at different times daily
//   const job = new CronJob('0 4 * * *', async () => {
//     try {
//       const bookings = await getBookingsWithEndDatePassed();
//       if (bookings.length > 0) {
//         bookings.forEach(async (booking) => {
//           await updateBookingStatus([BOOKING_STATUS.RETURN_DATE_PASSED, BOOKING_STATUS.RETURN_DATE_PASSED, booking.id] as Partial<Booking>);
//           console.log(`Updated status for booking ID ${booking.id}`);
//         });
//       } else {
//         console.log('[-----getBookingsWithEndDatePassedCron------]no booking to update');
//       }
//     } catch (error) {
//       console.error('Error in getBookingsWithEndDatePassedCron job:', error);
//     }
//   });

//   job.start();
//   console.log('Cron job started getBookingsWithEndDatePassedCron');
// };

// export const verifyTransactionsCron = (): void => {
//   //runs every 30mins
//   const job = new CronJob('*/30 * * * *', async () => {
//     try {
//       const transactions = await fetchPendingTransactions(['pending'] as Partial<Transaction>);
//       if (transactions.length > 0) {
//         transactions.forEach(async (transaction) => {
//           await verifyTransaction(transaction.reference);
//           console.log(`Transaction with ref ${transaction.reference} acted upon`);
//         });
//       } else {
//         console.log('[-----verifyTransactionsCron------] no transaction to update');
//       }
//     } catch (error) {
//       console.error('Error in verifyTransactionsCron job:', error);
//     }
//   });
//   job.start();
//   console.log('Cron job started for verifyTransactionsCron');
// };

// export const deleteAccountsCron = (): void => {
//   // runs at midnight daily
//   const job = new CronJob('0 0 * * *', async () => {
//     try {
//       const currentTime = new Date();
//       const accounts = await accountsToBeDeleted([currentTime] as Partial<User>);
//       if (accounts.length) {
//         const deletedAccounts = await deleteAccountQuery([currentTime] as Partial<User>);
//         console.log(`${accounts.length} account(s) deleted.`);
//       } else {
//         console.log('[-----deleteAccountsCron------] no account to delete');
//       }
//     } catch (error) {
//       console.error('Error in deleteAccountsCron job:', error);
//     }
//   });
//   job.start();
//   console.log('Cron job started for deleteAccount');
// };

// // Send Reminder Emails Every 10/20 Days
// export const sendAccountDeletionReminderCron = (): void => {
//   // runs at midnight daily
//   const job = new CronJob('0 0 * * *', async () => {
//     try {
//       const currentTime = new Date();

//       // Get users whose deletion is scheduled within the next 10/20 days
//       const result = await pool.query(
//         `SELECT id, email, first_name, deletion_scheduled_at 
//        FROM users 
//        WHERE is_active = false 
//        AND deletion_scheduled_at - INTERVAL '20 days' <= $1 
//        AND deletion_scheduled_at - INTERVAL '10 days' >= $1`,
//         [currentTime]
//       );

//       for (const user of result.rows) {
//         const emailTemplate = accountDeletionReminderTemplate(user?.first_name, user?.email, user?.deletion_scheduled_at);
//         const smsBody = `This is a reminder that your account is scheduled for permanent deletion on ${user?.deletion_scheduled_at.toDateString()}. 
//         If you wish to keep your account, please log in before that date to reactivate it.`;
//         await sendSmsToUser(smsBody, user?.phone_number);
//         transporter(emailTemplate);
//       }

//       console.log(`Reminder emails sent to ${result.rowCount} users.`);
//     } catch (error) {
//       console.error('Error in sendAccountDeletionReminderCron job:', error);
//     }
//   });
//   job.start();
//   console.log('Cron job started for sendAccountDeletionReminderCron');
// };

// export const cancelDelayedPaymentBookingsCron = async (): Promise<void> => {
//   // runs every 5 mins
//   const job = new CronJob('*/5 * * * *', async () => {
//     const client = await pool.connect();
//     try {
//       console.log('.... Running cron job to check for bookings awaiting payment...');

//       // Begin a transaction
//       await client.query('BEGIN');

//       // Get bookings created more than 30 minutes ago with status 'awaiting payment'
//       const result = await client.query(
//         `
//           SELECT id, listing_id, quantity
//           FROM bookings
//           WHERE rental_status = '${BOOKING_STATUS.AWAITING_PAYMENT}'
//           AND created_at < NOW() - INTERVAL '30 minutes'
//         `
//       );

//       const bookings = result.rows;

//       if (bookings.length === 0) {
//         return console.log('No bookings to update.');
//       } else {
//         // Loop through each booking and update the booking status and listing quantities
//         for (const booking of bookings) {
//           const { id, listing_id, quantity } = booking;

//           // Update the booking rental and listing status to 'delayed payment'
//           await client.query(
//             `
//               UPDATE bookings
//               SET rental_status = '${BOOKING_STATUS.DELAYED_PAYMENT}', listing_status = '${BOOKING_STATUS.DELAYED_PAYMENT}', updated_at = NOW()
//               WHERE id = $1
//             `,
//             [id]
//           );

//           // Increment the quantity_listed and quantity_available in the listings table
//           await client.query(
//             `
//               UPDATE listings
//               SET
//                 status = '${LISTING_STATUS.AVAILABLE}',
//                 quantity_listed = quantity_listed + $1,
//                 quantity_available = quantity_available + $1,
//                 updated_at = NOW()
//               WHERE id = $2
//             `,
//             [Number(quantity), listing_id]
//           );

//           console.log(`Booking ID ${id} has been canceled and listing ID ${listing_id} updated.`);
//         }
//       }

//       // Commit the transaction
//       await client.query('COMMIT');
//     } catch (error) {
//       console.error('Error during cancelDelayedBookingsCron job execution:', error);

//       // Rollback the transaction in case of error
//       await client.query('ROLLBACK');
//     } finally {
//       client.release();
//     }
//   });
//   job.start();
//   console.log('Cron job started for cancelDelayedBookingsCron');
// };

/**
 * cron to fetch created/pending orders from the db within the last hour
 * 
 * create payment plan when payment is successful
 * 
 * and work based on their status
 * 
 * create endpoint to turn off subscription with flutterwave
 * 
 * also notify users 48&24hrs to the end of their subscription that it will be renewed
 * 
 * confirm that between start and end date is usually seven days and that
 * 
 * start date is two days from current date
 * 
 */
