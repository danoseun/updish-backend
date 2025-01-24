import { CronJob } from 'cron';
import { fetchPendingOrders, updateOrderStatusByTransactionRef } from '../repository/order';
// import { fetchPendingTransactions } from '../repository/bookings';
// import { verifyRaveTransactions } from './flutterwave';
// import { BOOKING_STATUS, LISTING_STATUS } from '../constants';
import { Order } from '../interfaces';



// export const verifyOrdersCron = (): void => {
//   //runs every 10mins for a start
//   const job = new CronJob('*/10 * * * *', async () => {
//     try {
//       const orders = await fetchPendingOrders(['pending'] as Partial<Order>);
//       if (orders.length > 0) {
//         orders.forEach(async (order: Order) => {
//           const response = await verifyRaveTransactions(order.transaction_ref);
//           /**
//            * if response is valid, update the status of the order
//            * and probably notify the user of the successful transaction
//            * then create weekly payment plan
//            * else log the error and move on
//            */
//           if(response.data.status === 'success' || response.data.status === 'successful'){
//             if(Number(response.data.amount) < order.total_price || Number(response.data.amount) !== order.total_price){
//                 //throw error?
//                 console.log(`amount of ${response.data.amount} paid for transaction with price ${order.total_price} with ref ${order.transaction_ref} is unsufficient`);
//                 //maybe also notify an admin so they can process a refund for underpayment 
//                 //or refund excess in case of overpayment?
//             } else {
//                 /**
//                  * update order and create payment plan
//                  */
//                 await updateOrderStatusByTransactionRef(order.transaction_ref, 'paid');
//             }
//           }
//           console.log(`Orders Transaction with ref ${order.transaction_ref} acted upon`);
//         });
//       } else {
//         console.log('[-----verifyOrdersCron------] no transaction to update');
//       }
//     } catch (error) {
//       console.error('Error in verifyOrdersCron job:', error);
//     }
//   });
//   job.start();
//   console.log('Cron job started for verifyOrderssCron');
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
 * when flutterwave sends us a notification that the payment has been renewed,
 * we go ahead to create an order for the user
 * they can update it later with a patch endpoint
 * 
 * 
 * 
 * 
 */
